import { io, type Socket } from 'socket.io-client';
import { ForgeEngine, initialState, restoreState, remix, type Command, type ForgeState, type Scene } from '../shared/engine';
import type { TwitchStatus } from '../server/twitch';

const KEY='popforge.studio.v1';
type Connection={mode:'starting'|'server'|'browser'|'offline';twitch:TwitchStatus;codex:boolean;overlayToken:string;error:string|null};
const emptyTwitch:TwitchStatus={configured:false,connected:false,listening:false,name:null,category:null,error:null};
let localState=initialState();try{localState=restoreState(JSON.parse(localStorage.getItem(KEY)??'null'));}catch{}
let engine=new ForgeEngine(localState);
let state:ForgeState=engine.state;
let connection:Connection={mode:'starting',twitch:emptyTwitch,codex:false,overlayToken:'',error:null};
let socket:Socket|undefined;
let channel:BroadcastChannel|undefined;
const stateListeners=new Set<()=>void>();const connectionListeners=new Set<()=>void>();
const notifyState=()=>stateListeners.forEach(f=>f());
const updateConnection=(patch:Partial<Connection>)=>{connection={...connection,...patch};connectionListeners.forEach(f=>f());};
function save(){state=engine.state;try{localStorage.setItem(KEY,JSON.stringify(state));channel?.postMessage(state);}catch{}notifyState();}
function syncFromStorage(){try{const raw=localStorage.getItem(KEY);if(raw){state=restoreState(JSON.parse(raw));engine.state=state;notifyState();}}catch{}}
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
      state=restoreState(data.state);notifyState();
      updateConnection({mode:'server',twitch:data.twitch,codex:!!data.codex,overlayToken:data.overlayToken??token??''});
      socket=io({auth:viewer?{token,viewer:true}:{},reconnection:true});
      socket.on('state',(s:ForgeState)=>{state=restoreState(s);notifyState();});
      socket.on('twitch',(t:TwitchStatus)=>updateConnection({twitch:t}));
      socket.on('disconnect',()=>updateConnection({mode:'offline',error:'The local companion disconnected. Reconnecting…'}));
      socket.on('connect',()=>updateConnection({mode:'server',error:null}));
      socket.on('connect_error',()=>updateConnection({mode:'offline',error:'Cannot reach the local companion. Check that it is running.'}));
    }catch{
      if(token){updateConnection({mode:'offline',error:'Cannot reach this overlay session. Open the local companion and copy a fresh URL.'});return;}
      updateConnection({mode:'browser'});
      if('BroadcastChannel'in window){channel=new BroadcastChannel('popforge-studio');channel.onmessage=e=>{state=restoreState(e.data);engine.state=state;notifyState();};}
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
    const response=await fetch('/api/twitch/disconnect',{method:'POST',headers:{'X-Popforge-Request':'studio'}});if(!response.ok)throw new Error('Could not disconnect Twitch.');
  },
  url(route:string){const u=new URL(route,location.origin);if(connection.mode==='server'&&connection.overlayToken)u.searchParams.set('token',connection.overlayToken);return u.toString();},
};
