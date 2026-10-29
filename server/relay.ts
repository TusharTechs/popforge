import type express from 'express';
import {randomBytes} from 'node:crypto';
import {RelayEngine,RelaySetupSchema,RelayActionSchema,type RelaySide} from '../shared/relay.js';
import {ForgeEngine} from '../shared/engine.js';
import {TwitchBridge} from './twitch.js';

// One opt-in collaboration per local companion. Credentials and invitations never persist.
export function installRelay(app:express.Express,control:express.RequestHandler,host:TwitchBridge,origin:string,guestBridge?:TwitchBridge){
  let engine:RelayEngine|null=null;let invitation='';let expires=0;let guestSession='';let hostIdentity='';
  const pending=new Map<string,{session:string;expires:number;episode:string}>();
  const guest=guestBridge??new TwitchBridge(new ForgeEngine(),()=>{},()=> 'A PopForge Relay collaboration is in progress.');
  const cookie=(req:express.Request)=>req.headers.cookie?.split(';').map(p=>p.trim()).find(p=>p.startsWith('popforge_relay='))?.slice('popforge_relay='.length);
  const guestControl:express.RequestHandler=(req,res,next)=>{if(!engine||!guestSession||cookie(req)!==guestSession)return res.status(401).json({error:'Open a current creator invitation first.'});if(req.method!=='GET'&&req.headers['x-popforge-request']!=='studio')return res.status(403).json({error:'Missing request protection header.'});next();};
  const pauseOnDisconnect=()=>{if(engine&&host.status.connected&&host.accountId!==hostIdentity){engine=null;invitation='';guestSession='';guest.disconnect();return;}if(engine?.state.phase==='playing'&&(!host.status.connected||!host.status.listening||!guest.status.connected||!guest.status.listening))engine.act('host',{type:'pause'});};
  const snapshot=()=>{pauseOnDisconnect();engine?.tick();return {state:engine?.state??null,host:host.status,guest:guest.status};};
  const ingest=(side:RelaySide,event:Parameters<NonNullable<TwitchBridge['onChat']>>[0])=>{pauseOnDisconnect();engine?.ingest(side,event.userId,event.text,event.messageId,event.at,event.isBroadcaster||event.userId===host.accountId||event.userId===guest.accountId);};
  host.onChat=e=>ingest('host',e);guest.onChat=e=>ingest('guest',e);
  app.get('/api/relay',control,(_req,res)=>{res.setHeader('Cache-Control','no-store');res.json(snapshot());});
  app.post('/api/relay',control,(req,res)=>{try{
    if(!host.status.connected||!host.accountId)throw new Error('Connect the host Twitch account first.');
    const setup=RelaySetupSchema.parse(req.body);guest.disconnect();guestSession='';pending.clear();
    hostIdentity=host.accountId;engine=new RelayEngine('live',{...setup,host:{...setup.host,name:host.status.name!}});invitation=randomBytes(32).toString('hex');expires=Date.now()+30*60*1000;
    const url=new URL('/relay-join',origin);url.searchParams.set('invite',invitation);
    res.json({...snapshot(),inviteUrl:url.toString()});
  }catch(e){res.status(400).json({error:e instanceof Error?e.message:'Could not create invitation.'});}});
  app.post('/api/relay/join',(req,res)=>{
    if(req.headers['x-popforge-request']!=='studio')return res.status(403).json({error:'Missing request protection header.'});
    if(!invitation||Date.now()>expires||req.body?.invite!==invitation)return res.status(403).json({error:'Invitation expired or already claimed. Ask the host for a new episode invitation.'});
    invitation='';guestSession=randomBytes(32).toString('hex');
    res.cookie('popforge_relay',guestSession,{httpOnly:true,sameSite:'lax',secure:origin.startsWith('https:'),maxAge:4*60*60*1000});res.json(snapshot());
  });
  app.get('/api/relay/guest',guestControl,(_req,res)=>{res.setHeader('Cache-Control','no-store');res.json(snapshot());});
  const action=(side:RelaySide):express.RequestHandler=>(req,res)=>{try{
    if(!engine)throw new Error('Create an episode first.');const a=RelayActionSchema.parse(req.body);
    if(a.type==='approve'){
      if(!(side==='host'?host:guest).status.connected)throw new Error('Connect your own Twitch account before approving.');
      // Bind the introduction to the authenticated creator rather than a typed account name.
      engine.state.creators[side].name=(side==='host'?host:guest).status.name!;
    }
    if(['start','resume'].includes(a.type)&&(!host.status.listening||!guest.status.listening))throw new Error('Both Twitch chat connections must be listening.');
    engine.act(side,a);res.json(snapshot());
  }catch(e){res.status(400).json({error:e instanceof Error?e.message:'Invalid episode action.'});}};
  app.post('/api/relay/action',control,action('host'));
  app.post('/api/relay/guest/action',guestControl,action('guest'));
  app.get('/auth/twitch/relay',guestControl,(req,res)=>{
    if(!guest.status.configured||!engine)return res.redirect('/relay-join?error=setup');
    if(engine.state.creators.guest.approved)engine.act('guest',{type:'revoke'});
    const state='relay_'+randomBytes(32).toString('hex');pending.set(state,{session:guestSession,expires:Date.now()+600000,episode:engine.state.id});
    const url=new URL('https://id.twitch.tv/oauth2/authorize');url.search=new URLSearchParams({client_id:process.env.TWITCH_CLIENT_ID!,redirect_uri:process.env.TWITCH_REDIRECT_URI!,response_type:'code',scope:'user:read:chat user:write:chat',force_verify:'true',state}).toString();res.redirect(url.toString());
  });
  // Reuse the already registered Twitch callback URI, keeping the two OAuth sessions separate.
  app.get('/auth/twitch/callback',async(req,res,next)=>{
    const state=String(req.query.state??'');if(!state.startsWith('relay_'))return next();
    const p=pending.get(state);pending.delete(state);
    if(!p||p.expires<Date.now()||p.session!==cookie(req)||p.session!==guestSession||p.episode!==engine?.state.id)return res.status(403).send('Invalid creator authorization. Open a new invitation.');
    if(req.query.error)return res.redirect('/relay-join?error=denied');
    try{
      if(typeof req.query.code!=='string'||req.query.code.length>300)throw new Error('Invalid authorization.');
      await guest.connect(req.query.code);
      if(guest.accountId===host.accountId){guest.disconnect();return res.redirect('/relay-join?error=same-account');}
      if(p.episode!==engine?.state.id||p.session!==guestSession){guest.disconnect();throw new Error('Episode changed.');}
      engine.state.creators.guest.name=guest.status.name!;res.redirect('/relay-join?connected=1');
    }catch{res.redirect('/relay-join?error=connection');}
  });
  setInterval(()=>{pauseOnDisconnect();engine?.tick();for(const[k,p]of pending)if(p.expires<Date.now())pending.delete(k);},500).unref();
  return {close:()=>guest.disconnect(),publicState:()=>{const s=engine?.state;return s&&s.creators.host.approved&&s.creators.guest.approved?s:null;}};
}
