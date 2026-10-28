import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {io,type Socket} from 'socket.io-client';

const origin='http://localhost:14317';let processHandle:ChildProcess;let dataDir:string;let session='';let overlayToken='';const sockets:Socket[]=[];
before(async()=>{
  dataDir=await mkdtemp(path.join(tmpdir(),'popforge-test-'));
  processHandle=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:'14317',APP_ORIGIN:origin,NODE_ENV:'production',POPFORGE_DATA_DIR:dataDir,TWITCH_CLIENT_ID:'',TWITCH_CLIENT_SECRET:'',ENABLE_CODEX:'false'},stdio:'pipe'});
  let ready=false;for(let i=0;i<80;i++){try{const r=await fetch(origin+'/api/health');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'Test companion started');
  const response=await fetch(origin+'/api/bootstrap');session=response.headers.get('set-cookie')!.split(';')[0];overlayToken=(await response.json()).overlayToken;
});
after(async()=>{for(const s of sockets)s.disconnect();if(processHandle){processHandle.kill('SIGTERM');await new Promise<void>(resolve=>{if(processHandle.exitCode!==null)resolve();else processHandle.once('exit',()=>resolve());});}if(dataDir)await rm(dataDir,{recursive:true,force:true});});
const connect=async(viewer=false)=>{
  const socket=io(origin,{transports:['websocket'],extraHeaders:{Cookie:session,Origin:origin},auth:viewer?{viewer:true,token:overlayToken}:{},reconnection:false});sockets.push(socket);
  await new Promise<void>((resolve,reject)=>{socket.once('connect',()=>resolve());socket.once('connect_error',reject);});return socket;
};
const emit=(socket:Socket,event:string,payload:unknown)=>new Promise<any>((resolve,reject)=>socket.timeout(2000).emit(event,payload,(error:Error|null,value:unknown)=>error?reject(error):resolve(value)));
test('backend rejects cross-origin requests, missing control sessions, and invalid overlay tokens',async()=>{
  assert.equal((await fetch(origin+'/api/bootstrap',{headers:{Origin:'https://untrusted.invalid'}})).status,403);
  assert.equal((await fetch(origin+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'a garden',provider:'recipe'})})).status,401);
  assert.equal((await fetch(origin+'/api/view?token=bad')).status,403);
});
test('generation requires request protection and returns a validated recipe without calling AI',async()=>{
  const input={method:'POST',headers:{'Content-Type':'application/json',Cookie:session},body:JSON.stringify({prompt:'a purple garden',provider:'recipe'})};
  assert.equal((await fetch(origin+'/api/generate',input)).status,403);
  const response=await fetch(origin+'/api/generate',{...input,headers:{...input.headers,'X-Popforge-Request':'studio'}});
  assert.equal(response.status,200);const result=await response.json();assert.equal(result.provider,'recipe');assert.equal(result.scene.kind,'garden');
  const ai=await fetch(origin+'/api/generate',{...input,headers:{...input.headers,'X-Popforge-Request':'studio'},body:JSON.stringify({prompt:'a garden',provider:'codex'})});assert.equal(ai.status,400);
});
test('read-only overlay cannot mutate state even if its browser shares the dashboard cookie',async()=>{
  const viewer=await connect(true);assert.match((await emit(viewer,'command',{type:'start'})).error,/read-only/);
  assert.match((await emit(viewer,'demo-chat',{user:'x',text:'unlucky'})).error,/read-only/);
});
test('dashboard commands and demo chat synchronize to read-only viewers',async()=>{
  const controller=await connect();const viewer=await connect(true);
  const update=new Promise<any>(resolve=>viewer.on('state',s=>{if(s.round.actions===1)resolve(s);}));
  assert.equal((await emit(controller,'command',{type:'start'})).ok,true);
  assert.equal((await emit(controller,'demo-chat',{user:'testviewer',text:'!shield'})).ok,true);
  const state=await Promise.race([update,new Promise((_,reject)=>setTimeout(()=>reject(new Error('No viewer state update')),3000))]);
  assert.equal(state.round.actions,1);assert.equal(state.chat.at(-1).source,'demo');assert.equal('overlayToken'in state,false);
});
test('viewer state omits the moderation queue and approved notes can be withdrawn',async()=>{
  const controller=await connect();
  assert.equal((await emit(controller,'demo-chat',{user:'kindtester',text:'!kind Good to see everyone here.'})).ok,true);
  const privateState=(await(await fetch(origin+'/api/bootstrap',{headers:{Cookie:session}})).json()).state;
  const pending=privateState.lounge.pending[0];assert.ok(pending);
  const publicState=(await(await fetch(origin+`/api/view?token=${overlayToken}`)).json()).state;
  assert.equal(publicState.lounge.pending.length,0);assert.equal(publicState.lounge.wall.length,0);
  assert.equal((await emit(controller,'command',{type:'approveKindness',id:pending.id})).ok,true);
  const approved=(await(await fetch(origin+`/api/view?token=${overlayToken}`)).json()).state;
  assert.equal(approved.lounge.wall[0].text,'Good to see everyone here.');
});
