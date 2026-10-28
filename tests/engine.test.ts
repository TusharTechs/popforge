import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ForgeEngine,initialState,SceneSchema,RECIPES,recap,remix} from '../shared/engine.js';

test('chat vote is one vote per account, can change, and late votes do not count',()=>{
  const e=new ForgeEngine();e.dispatch({type:'poll'},1000);
  e.ingest('alice','!vote 1','demo','a',2000);e.ingest('alice','!vote 1','demo','b',2100);
  assert.deepEqual(e.state.poll?.counts,[1,0,0]);
  e.ingest('alice','!vote 2','demo','c',2200);assert.deepEqual(e.state.poll?.counts,[0,1,0]);
  e.ingest('bob','!vote 3','demo','d',47000);assert.deepEqual(e.state.poll?.counts,[0,1,0]);
  e.tick(47000);assert.equal(e.state.poll?.winner,1);assert.equal(e.state.poll?.status,'closed');
});
test('one viewer can participate repeatedly with cooldown, duplicate Twitch events are ignored',()=>{
  const e=new ForgeEngine();e.dispatch({type:'start'},1000);
  e.ingest('alice','!shield','twitch','msg1',1100);e.ingest('alice','!shield','twitch','msg1',4500);
  assert.equal(e.state.round.actions,1);
  e.ingest('alice','!shield','twitch','msg2',1200);assert.equal(e.state.round.actions,1);
  e.ingest('alice','!shield','twitch','msg3',4200);assert.equal(e.state.round.actions,2);assert.equal(e.state.round.participants,1);
});
test('round timing survives pause and resume, and produces grounded loss lore',()=>{
  const e=new ForgeEngine();e.dispatch({type:'start'},1000);e.dispatch({type:'pause'},11000);
  assert.equal(e.state.round.remaining,170000);assert.equal(e.tick(999999),null);
  e.dispatch({type:'resume'},1000000);assert.equal(e.state.round.deadline,1170000);
  e.tick(1170000);assert.equal(e.state.round.outcome,'lost');assert.equal(e.state.stats.rounds,1);
  assert.equal(recap(e.state,900000,1170000).moments.at(-1)?.title,'The moon took a hit');
});
test('reaching the team goal ends once and preserves community victory',()=>{
  const e=new ForgeEngine();e.dispatch({type:'publish',scene:{...RECIPES[0].scene,goal:5}},1000);e.dispatch({type:'start'},2000);
  for(let i=0;i<5;i++)e.ingest(`viewer${i}`,'!shield','demo',`m${i}`,2500+i);
  assert.equal(e.state.round.outcome,'saved');assert.equal(e.state.round.status,'ended');assert.equal(e.state.stats.rounds,1);
  e.tick(999999);assert.equal(e.state.stats.rounds,1);assert.equal(e.state.round.participants,5);
});
test('scene publication validates bounds, preserves rollback and has no executable fields',()=>{
  const e=new ForgeEngine();assert.throws(()=>e.dispatch({type:'publish',scene:{...RECIPES[0].scene,duration:9999}}));
  e.dispatch({type:'publish',scene:RECIPES[2].scene});assert.equal(e.state.scene.kind,'garden');
  e.dispatch({type:'rollback'});assert.equal(e.state.scene.kind,'reactor');
  assert.equal('script' in SceneSchema.parse({...RECIPES[0].scene,script:'alert(1)'}),false);
});
test('recipe generation honors supported parameters and recaps never invent history',()=>{
  const scene=remix('A purple garden for 2 minutes, low gravity. Keyword bloom');
  assert.equal(scene.kind,'garden');assert.equal(scene.duration,120);assert.equal(scene.accent,'lilac');assert.equal(scene.gravity,'low');
  assert.deepEqual(recap(initialState()).moments,[]);
});
test('keyword triggers match whole words and proposals remain pending for streamer approval',()=>{
  const e=new ForgeEngine();e.ingest('a','notunlucky','demo','m1');assert.equal(e.state.charge,30);
  e.ingest('a','that was UNLUCKY!','demo','m2');assert.equal(e.state.charge,40);
  e.ingest('a','!forge a garden','demo','m3');assert.equal(e.state.proposals.length,1);assert.equal(e.state.scene.kind,'reactor');
});
