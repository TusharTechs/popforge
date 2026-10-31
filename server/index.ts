import 'dotenv/config';
import express from 'express';
import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import path from 'node:path';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {Server} from 'socket.io';
import {z} from 'zod';
import {ForgeEngine,initialState,restoreState,recap} from '../shared/engine.js';
import {generateScene} from './generator.js';
import {TwitchBridge} from './twitch.js';
import {installRelay} from './relay.js';
import {LocalIdentity} from './local-identity.js';
import {RuntimeStore} from './runtime-store.js';

const port=Number(process.env.PORT??4317);
const origin=process.env.APP_ORIGIN??`http://localhost:${port}`;
process.env.TWITCH_REDIRECT_URI??=`${origin}/auth/twitch/callback`;
const allowedOrigins=new Set([origin,`http://127.0.0.1:${port}`]);
const app=express();const http=createServer(app);
const token=()=>randomBytes(32).toString('hex');
const dataDirectory=path.resolve(process.env.POPFORGE_DATA_DIR??'.data');
const identity=new LocalIdentity(dataDirectory);
let overlayToken=identity.overlayToken;
const sessions=new Map<string,number>();const oauth=new Map<string,{session:string,expires:number}>();
const stateFile=path.join(dataDirectory,'state.json');
const runtimeStore=new RuntimeStore(dataDirectory);const recovered=runtimeStore.load();
let saved=recovered?.state??initialState();if(!recovered)try{saved=restoreState(JSON.parse(await readFile(stateFile,'utf8')));}catch{}
// Private vote/cooldown ledgers are intentionally not persisted. Never resume a live
// round or vote with an incomplete ledger after a process restart.
if(saved.round.status==='playing'||saved.round.status==='paused')saved.round={...initialState().round,remaining:saved.scene.duration*1000};
if(saved.poll?.status==='open')saved.poll={...saved.poll,status:'closed',winner:null};
// Mood-vote identity ledgers are private/in-memory, so reopen suggestions fresh.
if(!recovered)saved.lounge.vibeVotes=[0,0,0,0];
saved.lounge.effects=[];
if(saved.lounge.break.status==='running')saved.lounge.break.status='resting';
const engine=new ForgeEngine(saved,recovered?.recovery);
const io=new Server(http,{serveClient:false,maxHttpBufferSize:16000,allowRequest:(req,cb)=>cb(null,!req.headers.origin||allowedOrigins.has(req.headers.origin))});
const cookie=(raw='')=>raw.split(';').map(p=>p.trim().split('=')).find(p=>p[0]==='popforge_session')?.[1];
const valid=(id?:string)=>!!id&&(sessions.get(id)??0)>Date.now();
const equal=(a:unknown,b:string)=>typeof a==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const snapshot=()=>JSON.parse(JSON.stringify(engine.state));
const viewerSnapshot=()=>{const s=snapshot();s.lounge.pending=[];s.proposals=[];return s;};
let broadcastTimer:ReturnType<typeof setTimeout>|undefined;
let dirty=false;let storageError:string|null=null;
function checkpoint(){try{runtimeStore.save(engine);storageError=null;dirty=false;}catch{storageError='Local changes could not be saved. Check disk space and permissions before continuing.';}return storageError===null;}
function notify(){dirty=true;if(!broadcastTimer)broadcastTimer=setTimeout(()=>{checkpoint();io.to('control').emit('storage',{healthy:storageError===null,error:storageError});io.to('control').emit('state',snapshot());io.to('viewer').emit('state',viewerSnapshot());io.emit('twitch',bridge.status);broadcastTimer=undefined;},100);}
const bridge=new TwitchBridge(engine,notify,()=>{const r=recap(engine.state);return `${r.moments.map(m=>m.title).join(' · ')||'A new chapter is starting.'}${r.world.length?' Our garden keeps '+r.world.join(', ')+'.':''} ${r.action}`;},identity);
const sources=()=>({visual:[...io.sockets.sockets.values()].filter(s=>s.data.role==='viewer'&&s.data.surface==='overlay').length,audio:[...io.sockets.sockets.values()].filter(s=>s.data.role==='viewer'&&s.data.surface==='sound').length});
const notifySources=()=>io.to('control').emit('sources',sources());

app.use(express.json({limit:'16kb'}));
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.headers.origin&&!allowedOrigins.has(req.headers.origin))return res.status(403).json({error:'Origin not allowed.'});
  if(req.headers['sec-fetch-site']==='cross-site'&&req.path.startsWith('/api'))return res.status(403).json({error:'Open PopForge directly to continue.'});
  next();
});
const control:express.RequestHandler=(req,res,next)=>{if(!valid(cookie(req.headers.cookie)))return res.status(401).json({error:'Open the dashboard to establish a local session.'});if(req.method!=='GET'&&req.headers['x-popforge-request']!=='studio')return res.status(403).json({error:'Missing request protection header.'});next();};
const relay=installRelay(app,control,bridge,origin);
app.get('/api/relay/overlay',(req,res)=>{if(!equal(req.query.token,overlayToken))return res.status(403).json({error:'Overlay link expired.'});res.setHeader('Cache-Control','no-store');res.json({state:relay.publicState()});});
app.get('/api/bootstrap',(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const id=cookie(req.headers.cookie);
  if(!valid(id)){const s=token();sessions.set(s,Date.now()+24*60*60*1000);res.cookie('popforge_session',s,{httpOnly:true,sameSite:'lax',secure:origin.startsWith('https:'),maxAge:24*60*60*1000});}
  res.json({backend:true,state:snapshot(),overlayToken,twitch:bridge.status,sources:sources(),storage:{healthy:storageError===null,error:storageError},codex:process.env.ENABLE_CODEX==='true'});
});
app.get('/api/view',(req,res)=>{
  if(!equal(req.query.token,overlayToken))return res.status(403).json({error:'This overlay link expired. Copy a new link from the studio.'});
  res.setHeader('Cache-Control','no-store');res.json({backend:true,state:viewerSnapshot(),twitch:bridge.status});
});
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'popforge'}));
app.post('/api/generate',control,async(req,res)=>{
  try{const body=z.object({prompt:z.string().min(5).max(1500),provider:z.enum(['recipe','codex'])}).parse(req.body);res.json(await generateScene(body.prompt,body.provider==='codex'));}
  catch(e){res.status(400).json({error:e instanceof Error?e.message:'Scene generation failed.'});}
});
app.get('/auth/twitch',control,(req,res)=>{
  if(!bridge.status.configured)return res.redirect('/?setup=twitch');
  const state=token();oauth.set(state,{session:cookie(req.headers.cookie)!,expires:Date.now()+10*60*1000});
  const url=new URL('https://id.twitch.tv/oauth2/authorize');
  url.search=new URLSearchParams({client_id:process.env.TWITCH_CLIENT_ID!,redirect_uri:process.env.TWITCH_REDIRECT_URI!,response_type:'code',scope:'user:read:chat user:write:chat',state}).toString();res.redirect(url.toString());
});
app.get('/auth/twitch/callback',async(req,res)=>{
  const state=String(req.query.state??'');const pending=oauth.get(state);oauth.delete(state);
  if(!pending||pending.expires<Date.now()||pending.session!==cookie(req.headers.cookie))return res.status(403).send('Invalid or expired Twitch authorization. Return to PopForge and try again.');
  if(req.query.error)return res.redirect('/?twitch=denied');
  try{const code=z.string().min(5).max(300).parse(req.query.code);await bridge.connect(code);res.redirect('/?twitch=connected');}
  catch{res.redirect('/?twitch=error');}
});
app.post('/api/twitch/disconnect',control,(_req,res)=>{try{bridge.disconnect();res.json({ok:true});}catch{res.status(500).json({error:'Could not forget the saved connection. Check disk access and try again.'});}});
app.post('/api/twitch/retry',control,async(_req,res)=>{await bridge.restore();res.json({twitch:bridge.status});});
app.post('/api/overlay/rotate',control,(_req,res)=>{
  try{
    overlayToken=identity.rotateOverlay();
    for(const socket of io.sockets.sockets.values())if(socket.data.role==='viewer')socket.disconnect(true);
    io.to('control').emit('overlayToken',overlayToken);notifySources();res.json({ok:true});
  }catch{res.status(500).json({error:'Could not replace the source links. Check disk access.'});}
});
io.use((socket,next)=>{
  if(socket.handshake.auth.viewer){
    if(equal(socket.handshake.auth.token,overlayToken)){socket.data.role='viewer';return next();}
    return next(new Error('This read-only source link expired.'));
  }
  if(valid(cookie(socket.request.headers.cookie))){socket.data.role='control';return next();}
  if(equal(socket.handshake.auth.token,overlayToken)){socket.data.role='viewer';return next();}
  next(new Error('Session expired. Reload PopForge.'));
});
io.on('connection',socket=>{
  socket.data.surface=['overlay','sound','recap'].includes(socket.handshake.auth.surface)?socket.handshake.auth.surface:'unknown';
  void socket.join(socket.data.role==='control'?'control':'viewer');
  socket.emit('state',socket.data.role==='control'?snapshot():viewerSnapshot());socket.emit('twitch',bridge.status);
  if(socket.data.role==='control')socket.emit('sources',sources());
  notifySources();socket.on('disconnect',notifySources);
  let lastCommand=0;
  socket.on('command',(command,ack)=>{
    if(typeof ack!=='function')return;
    if(socket.data.role!=='control')return ack({error:'This source is read-only.'});
    if(Date.now()-lastCommand<60)return ack({error:'Please slow down.'});lastCommand=Date.now();
    try{engine.dispatch(command);if(!checkpoint())throw new Error(storageError!);notify();ack({ok:true});}catch(e){ack({error:e instanceof Error?e.message:'Invalid command.'});}
  });
  socket.on('demo-chat',(message,ack)=>{
    if(typeof ack!=='function')return;
    if(socket.data.role!=='control')return ack({error:'This source is read-only.'});
    if(bridge.status.connected)return ack({error:'Demo input is disabled while Twitch is connected.'});
    try{const m=z.object({user:z.string().min(1).max(40),text:z.string().min(1).max(500)}).parse(message);engine.ingest(m.user,m.text,'demo');if(!checkpoint())throw new Error(storageError!);notify();ack({ok:true});}catch{ack({error:'Invalid demo message.'});}
  });
});
setInterval(()=>{if(engine.tick())notify();for(const [key,expiry]of sessions)if(expiry<Date.now())sessions.delete(key);for(const[key,pending]of oauth)if(pending.expires<Date.now())oauth.delete(key);},250).unref();
// Public state is separate from the encrypted local identity and Twitch credentials.
setInterval(()=>{if(dirty)checkpoint();},2000).unref();
let closeDevelopmentServer:(()=>Promise<void>)|undefined;
if(process.env.NODE_ENV==='production'){
  app.use(express.static(path.resolve('dist')));app.get('/{*splat}',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));
}else{
  const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);closeDevelopmentServer=()=>vite.close();
}
http.listen(port,'127.0.0.1',()=>{console.log(`PopForge studio ready: ${origin}\nLocal broadcaster companion · Twitch ${bridge.status.configured?'configured':'not configured'} · Codex ${process.env.ENABLE_CODEX==='true'?'enabled':'disabled'}`);void bridge.restore();});
let shuttingDown=false;
async function shutdown(){if(shuttingDown)return;shuttingDown=true;relay.close();bridge.stop();if(broadcastTimer){clearTimeout(broadcastTimer);broadcastTimer=undefined;}checkpoint();await closeDevelopmentServer?.();io.close();http.close();}
process.once('SIGTERM',()=>void shutdown());process.once('SIGINT',()=>void shutdown());
