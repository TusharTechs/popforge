import { io, type Socket } from 'socket.io-client';
import { ForgeEngine, EngineRecoverySchema, initialState, restoreState, remix, type Command, type ForgeState, type Scene } from '../shared/engine';
import type { TwitchStatus } from '../server/twitch';

const KEY='popforge.studio.v2';
export type Connection={storage?:{healthy:boolean;error:string|null};mode:'starting'|'server'|'browser'|'offline';twitch:TwitchStatus;codex:boolean;overlayToken:string;error:string|null;sources:{visual:number;audio:number}};
const emptyTwitch:TwitchStatus={configured:false,connected:false,listening:false,name:null,category:null,error:null};
function browserEngine(){try{const raw=JSON.parse(localStorage.getItem(KEY)??'null');if(raw?.state)return new ForgeEngine(restoreState(raw.state),EngineRecoverySchema.parse(raw.recovery));const legacy=localStorage.getItem('popforge.studio.v1');return new ForgeEngine(legacy?restoreState(JSON.parse(legacy)):initialState());}catch{return new ForgeEngine();}}
let engine=browserEngine();
let state:ForgeState=engine.state;
let connection:Connection={mode:'starting',twitch:emptyTwitch,codex:false,overlayToken:'',error:null,sources:{visual:0,audio:0}};
let socket:Socket|undefined;
let channel:BroadcastChannel|undefined;
const stateListeners=new Set<()=>void>();const connectionListeners=new Set<()=>void>();
const notifyState=()=>stateListeners.forEach(f=>f());
const updateConnection=(patch:Partial<Connection>)=>{connection={...connection,...patch};connectionListeners.forEach(f=>f());};
function save(){state=engine.state;try{const checkpoint={state,recovery:engine.recovery()};localStorage.setItem(KEY,JSON.stringify(checkpoint));channel?.postMessage(checkpoint);}catch{}notifyState();}
function syncFromStorage(){try{const raw=localStorage.getItem(KEY);if(raw&&JSON.parse(raw)?.state?.revision===engine.state.revision)return;}catch{}engine=browserEngine();state=engine.state;notifyState();}
let initialized=false;
export const client={
  subscribe:(f:()=>void)=>{stateListeners.add(f);return()=>{stateListeners.delete(f);};},
  getState:()=>state,
  subscribeConnection:(f:()=>void)=>{connectionListeners.add(f);return()=>{connectionListeners.delete(f);};},
  getConnection:()=>connection,
  async init(viewer=false){
    if(initialized)return;initialized=true;
    const token=new URLSearchParams(location.search).get('token');
    try{
      const response=await fetch(viewer?`/api/view?token=${encodeURIComponent(token??'')}`:'/api/bootstrap',{signal:AbortSignal.timeout(4000)});
      if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('STATIC_DEMO');
      const data=await response.json();
      if(!response.ok){updateConnection({mode:'offline',error:data.error??'Cannot open this source.'});return;}
      state=restoreState(data.state);notifyState();if(data.storage)updateConnection({storage:data.storage});
      updateConnection({mode:'server',twitch:data.twitch,codex:!!data.codex,overlayToken:data.overlayToken??token??'',sources:data.sources??{visual:0,audio:0}});
      socket=io({auth:viewer?{token,viewer:true,surface:location.pathname.slice(1)}:{},reconnection:true});
      socket.on('state',(s:ForgeState)=>{state=restoreState(s);notifyState();});
      socket.on('twitch',(t:TwitchStatus)=>updateConnection({twitch:t}));
      socket.on('sources',(sources:Connection['sources'])=>updateConnection({sources}));
      socket.on('storage',(storage:NonNullable<Connection['storage']>)=>updateConnection({storage}));
      socket.on('overlayToken',(overlayToken:string)=>updateConnection({overlayToken}));
      socket.on('disconnect',(reason)=>updateConnection({mode:'offline',sources:{visual:0,audio:0},error:reason==='io server disconnect'?'This source link was replaced. Copy the new link from PopForge.':'The local companion disconnected. Reconnecting…'}));
      socket.on('connect',()=>updateConnection({mode:'server',error:null}));
      let renewing=false;
      socket.on('connect_error',async()=>{
        updateConnection({mode:'offline',error:'Cannot reach the local companion. Reconnecting…'});
        if(viewer||renewing)return;
        renewing=true;
        // A restart invalidates local control sessions, but not the OBS link.
        // Bootstrap a new HttpOnly session before retrying the control socket.
        try{
          const r=await fetch('/api/bootstrap',{signal:AbortSignal.timeout(4000)});
          if(!r.ok)throw new Error('Session unavailable');const data=await r.json();
          updateConnection({twitch:data.twitch,overlayToken:data.overlayToken,codex:!!data.codex,sources:data.sources??{visual:0,audio:0}});
          socket?.connect();
        }catch{}finally{setTimeout(()=>{renewing=false;if(!socket?.connected)socket?.connect();},2000);}
      });
    }catch(error){
      const staticPreview=error instanceof Error&&error.message==='STATIC_DEMO';
      if(token||(['localhost','127.0.0.1'].includes(location.hostname)&&!staticPreview)){
        updateConnection({mode:'offline',error:'Waiting for the local companion. Your saved source link will reconnect when it starts.'});
        setTimeout(()=>{initialized=false;void client.init(viewer);},3000);return;
      }
      updateConnection({mode:'browser'});
      if('BroadcastChannel'in window){channel=new BroadcastChannel('popforge-studio');channel.onmessage=e=>{try{engine=new ForgeEngine(restoreState(e.data.state),EngineRecoverySchema.parse(e.data.recovery));state=engine.state;notifyState();}catch{}};}
      window.addEventListener('storage',e=>{if(e.key===KEY)syncFromStorage();});
      if(!viewer)setInterval(()=>{syncFromStorage();if(engine.tick())save();},500);
    }
  },
  async command(command:Command){
    if(connection.mode==='server'){
      await new Promise<void>((resolve,reject)=>{socket?.timeout(4000).emit('command',command,(error:Error|null,res:{error?:string})=>error?reject(new Error('Command timed out. Check your connection.')):res?.error?reject(new Error(res.error)):resolve());});
    }else if(connection.mode==='browser'){syncFromStorage();engine.dispatch(command);save();}
    else throw new Error(connection.error??'The studio is connecting.');
  },
  async demoChat(user:string,text:string){
    if(connection.twitch.connected)throw new Error('Disconnect Twitch before sending demo events.');
    if(connection.mode==='server')await new Promise<void>((resolve,reject)=>{socket?.timeout(4000).emit('demo-chat',{user,text},(error:Error|null,res:{error?:string})=>error?reject(new Error('Demo event timed out.')):res?.error?reject(new Error(res.error)):resolve());});
    else if(connection.mode==='browser'){syncFromStorage();engine.ingest(user,text,'demo');save();}
    else throw new Error('The studio is reconnecting.');
  },
  async generate(prompt:string,provider:'recipe'|'codex'):Promise<{scene:Scene;provider:string;checks:string[];threadId?:string}>{
    if(prompt.trim().length<5)throw new Error('Give your scene a little more detail.');
    if(connection.mode==='server'){
      const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json','X-Popforge-Request':'studio'},body:JSON.stringify({prompt,provider}),signal:AbortSignal.timeout(100000)});
      const data=await response.json();if(!response.ok)throw new Error(data.error);return data;
    }
    if(provider==='codex')throw new Error('Codex generation requires the local companion and a configured Codex login.');
    return {scene:remix(prompt),provider:'recipe',checks:['Scene schema valid','Trusted renderer compatible','No executable code or external assets']};
  },
  async disconnectTwitch(){
    const response=await fetch('/api/twitch/disconnect',{method:'POST',headers:{'X-Popforge-Request':'studio'}});if(!response.ok)throw new Error('Could not forget the Twitch connection. Check disk access and try again.');
  },
  async retryTwitch(){const r=await fetch('/api/twitch/retry',{method:'POST',headers:{'X-Popforge-Request':'studio'}});if(!r.ok)throw new Error('Could not retry Twitch.');updateConnection({twitch:(await r.json()).twitch});},
  async rotateOverlay(){const r=await fetch('/api/overlay/rotate',{method:'POST',headers:{'X-Popforge-Request':'studio'}});if(!r.ok)throw new Error('Could not replace source links.');},
  url(route:string){const u=new URL(route,location.origin);if(connection.overlayToken)u.searchParams.set('token',connection.overlayToken);return u.toString();},
};
