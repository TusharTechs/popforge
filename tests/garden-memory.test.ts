import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ForgeEngine,RECIPES,initialState,restoreState} from '../shared/engine.js';
test('live blooms survive restore and fresh sessions while rehearsal remains separate',()=>{
 const e=new ForgeEngine();e.dispatch({type:'startMoment',scene:{...RECIPES[2].scene,goal:10}},1000);
 for(let i=0;i<5;i++)e.ingest('one-person',i===4?'!plant sunset':'!water','twitch','live'+i,2000+i*3100);
 e.ingest('demo-person','!water','demo','demo',18000);
 assert.equal(e.state.garden.water,5);assert.deepEqual(e.state.garden.blooms,['sunset']);assert.equal(e.state.demoGarden.water,1);
 const restored=new ForgeEngine(restoreState(JSON.parse(JSON.stringify(e.state))));restored.dispatch({type:'reset'});
 assert.deepEqual(restored.state.garden,e.state.garden);assert.equal(restored.state.demoGarden.water,0);
});
test('duplicate, cooldown and idle actions cannot inflate the lasting garden',()=>{
 const e=new ForgeEngine();e.ingest('a','!plant moon','twitch','idle',1000);assert.equal(e.state.garden.water,0);
 e.dispatch({type:'startMoment',scene:RECIPES[2].scene},2000);e.ingest('a','!water','twitch','one',3000);e.ingest('a','!water','twitch','one',9000);e.ingest('a','!water','twitch','two',3100);
 assert.equal(e.state.garden.water,1);
 const old=initialState() as any;delete old.garden;delete old.demoGarden;assert.equal(restoreState(old).garden.water,0);
});
test('focus timer does not end at chat goal and task success requires explicit streamer confirmation',()=>{
 const e=new ForgeEngine();e.dispatch({type:'startMoment',scene:{...RECIPES[3].scene,goal:5,duration:60}},1000);
 for(let i=0;i<5;i++)e.ingest(String(i),'!cheer','twitch',String(i),2000);
 assert.equal(e.state.round.status,'playing');e.tick(62000);assert.match(e.state.events[0].detail,/not been confirmed/);assert.equal(e.state.events[0].title,'The focus sprint ended');
 e.dispatch({type:'confirmTask'},63000);assert.equal(e.state.taskConfirmed,true);assert.throws(()=>e.dispatch({type:'confirmTask'}));
});
