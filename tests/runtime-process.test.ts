import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {io} from 'socket.io-client';
import {ForgeEngine,RECIPES} from '../shared/engine.js';
import {RuntimeStore} from '../server/runtime-store.js';
test('a real companion restart restores the world choice ledger but never exposes it to sources',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'popforge-world-process-'));let child:ChildProcess|undefined;let socket:ReturnType<typeof io>|undefined;const origin='http://127.0.0.1:14319';
 try{
  const now=Date.now();const engine=new ForgeEngine();engine.dispatch({type:'startMoment',scene:{...RECIPES[2].scene,goal:5}},now-20000);for(let i=0;i<5;i++)engine.ingest('grower','!water','demo','seed-'+i,now-19000+i*3100);engine.dispatch({type:'openGardenVote',mode:'rehearsal'},now);engine.ingest('returning-chatter','!grow pond','demo','vote-before-restart',now+1);new RuntimeStore(dir).save(engine);
  child=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,PORT:'14319',APP_ORIGIN:origin,NODE_ENV:'production',POPFORGE_DATA_DIR:dir,TWITCH_CLIENT_ID:'',TWITCH_CLIENT_SECRET:'',ENABLE_CODEX:'false'},stdio:'ignore'});
  let ready=false;for(let i=0;i<80;i++){try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
  const response=await fetch(origin+'/api/bootstrap');const cookie=response.headers.get('set-cookie')!.split(';')[0];const boot=await response.json();assert.deepEqual(boot.state.demoGarden.decision.counts,[1,0,0]);assert.equal('recovery' in boot,false);assert.equal('gardenVotes' in boot.state,false);
  socket=io(origin,{transports:['websocket'],extraHeaders:{Cookie:cookie,Origin:origin},reconnection:false});await new Promise<void>((resolve,reject)=>{socket!.once('connect',()=>resolve());socket!.once('connect_error',reject);});
  const chat=(text:string)=>new Promise<any>((resolve,reject)=>socket!.timeout(3000).emit('demo-chat',{user:'returning-chatter',text},(e:Error|null,r:unknown)=>e?reject(e):resolve(r)));
  assert.equal((await chat('!grow pond')).ok,true);let state=(await(await fetch(origin+'/api/bootstrap')).json()).state;assert.deepEqual(state.demoGarden.decision.counts,[1,0,0]);assert.equal((await chat('!grow nook')).ok,true);state=(await(await fetch(origin+'/api/bootstrap')).json()).state;assert.deepEqual(state.demoGarden.decision.counts,[0,1,0]);
  const reader=await(await fetch(origin+'/api/view?token='+boot.overlayToken)).json();assert.equal('recovery' in reader,false);assert.equal('gardenVotes' in reader.state,false);assert.equal(reader.state.demoGarden.water,5);
 }finally{socket?.disconnect();if(child?.exitCode===null){const active=child;await new Promise<void>(r=>{active.once('exit',()=>r());active.kill('SIGTERM');});}await rm(dir,{recursive:true,force:true});}
});
