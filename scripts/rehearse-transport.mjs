import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
import {io} from 'socket.io-client';
const option=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const events=Number(option('--events','500')),readers=Number(option('--readers','20'));
if(!Number.isInteger(events)||events<10||events>1000||!Number.isInteger(readers)||readers<1||readers>50)throw new Error('Use 10–1000 synthetic events and 1–50 local reader sockets.');
const dir=await mkdtemp(path.join(tmpdir(),'popforge-transport-'));const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));const origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:String(port),APP_ORIGIN:origin,NODE_ENV:'production',POPFORGE_DATA_DIR:dir,TWITCH_CLIENT_ID:'',TWITCH_CLIENT_SECRET:'',ENABLE_CODEX:'false'},stdio:'ignore'});const sockets=[];const latest=[];
const emit=(socket,event,payload)=>new Promise((resolve,reject)=>socket.timeout(10000).emit(event,payload,(e,r)=>e?reject(e):r?.error?reject(new Error(r.error)):resolve(r)));
const connect=async(auth={},cookie='')=>{const s=io(origin,{auth,extraHeaders:{Cookie:cookie,Origin:origin},transports:['websocket'],reconnection:false});sockets.push(s);await new Promise((r,j)=>{s.once('connect',r);s.once('connect_error',j);});return s;};
try{
 let ready=false;for(let n=0;n<100;n++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw new Error('Isolated companion did not start.');
 const response=await fetch(origin+'/api/bootstrap');const cookie=response.headers.get('set-cookie').split(';')[0];const boot=await response.json();if(boot.twitch.configured||boot.twitch.connected||boot.codex)throw new Error('This rehearsal must not use real Twitch or Codex credentials.');const control=await connect({},cookie);
 for(let i=0;i<readers;i++){const s=await connect({viewer:true,surface:'overlay',token:boot.overlayToken});s.on('state',value=>{latest[i]=value.revision;});}
 await emit(control,'command',{type:'startMoment',scene:{...boot.state.scene,kind:'focus',goal:100,duration:300}});
 const timings=[];const started=performance.now();for(let i=0;i<events;i++){const t=performance.now();await emit(control,'demo-chat',{user:'synthetic-'+i,text:'!cheer'});timings.push(performance.now()-t);}
 const state=(await(await fetch(origin+'/api/bootstrap',{headers:{Cookie:cookie}})).json()).state;
 for(let n=0;n<100&&!latest.every(x=>x>=state.revision);n++)await new Promise(r=>setTimeout(r,50));
 const sorted=timings.toSorted((a,b)=>a-b);const report={kind:'INTERNAL LOCAL SOCKET TRANSPORT REHEARSAL',at:new Date().toISOString(),syntheticDemoEvents:events,localReaderSockets:readers,acceptedActions:state.round.actions,allReadersConverged:latest.length===readers&&latest.every(x=>x>=state.revision),elapsedMs:Math.round(performance.now()-started),ackMs:{median:Number(sorted[Math.floor(sorted.length*.5)].toFixed(2)),p95:Number(sorted[Math.floor(sorted.length*.95)].toFixed(2))},realTwitchConnection:false,realViewersCreated:0,limitations:['Localhost sockets with synthetic demo commands only.','Acknowledgment time includes local durable checkpoint writes; it is not OBS render latency.','Not Twitch rate-limit, Internet, remote-device, large-audience, retention, or growth evidence.']};
 console.log(JSON.stringify(report,null,2));const output=option('--output',null);if(output)await writeFile(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});if(!report.allReadersConverged||report.acceptedActions!==events)process.exitCode=1;
}finally{for(const socket of sockets)socket.disconnect();if(child.exitCode===null){await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});}await rm(dir,{recursive:true,force:true});}
