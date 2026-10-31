import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ForgeEngine,RECIPES,restoreState,recap} from '../shared/engine.js';
import {gardenSeeds} from '../shared/world.js';
const grow=(e:ForgeEngine,source:'twitch'|'demo',start=1000)=>{e.dispatch({type:'startMoment',scene:{...RECIPES[2].scene,goal:5}},start);for(let i=0;i<5;i++)e.ingest('gardener','!water',source,source+i,start+100+i*3100);};
test('world choices require earned seeds, independent accounts, explicit approval, and persist across fresh sessions',()=>{
 const e=new ForgeEngine();assert.throws(()=>e.dispatch({type:'openGardenVote',mode:'live'},0));grow(e,'twitch');assert.equal(gardenSeeds(e.state.garden),1);
 e.dispatch({type:'openGardenVote',mode:'live'},20000);assert.throws(()=>e.dispatch({type:'buildGardenChoice',mode:'live'},21000));
 e.ingest('creator','!grow pond','twitch','creator',22000,'Creator',true);assert.deepEqual(e.state.garden.decision!.counts,[0,0,0]);
 e.ingest('a','!grow pond','twitch','a1',23000);e.ingest('a','!grow pond','twitch','a2',24000);e.ingest('a','!grow nook','twitch','a3',25000);e.ingest('b','!grow nook','twitch','b',26000);
 assert.deepEqual(e.state.garden.decision!.counts,[0,2,0]);assert.equal(e.state.garden.landmarks.length,0);e.dispatch({type:'closeGardenVote',mode:'live'},27000);e.dispatch({type:'buildGardenChoice',mode:'live'},28000);
 assert.deepEqual(e.state.garden.landmarks,['nook']);assert.equal(gardenSeeds(e.state.garden),0);assert.throws(()=>e.dispatch({type:'buildGardenChoice',mode:'live'},29000));
 const returned=new ForgeEngine(restoreState(JSON.parse(JSON.stringify(e.state))),e.recovery());returned.dispatch({type:'reset'},30000);assert.deepEqual(returned.state.garden.landmarks,['nook']);assert.equal(returned.state.garden.chapters[0].votes,2);assert.deepEqual(recap(returned.state).world,['Reading nook']);
});
test('ties, empty choices, late messages, and rehearsal never spend live seeds',()=>{
 const e=new ForgeEngine();grow(e,'demo');e.dispatch({type:'openGardenVote',mode:'rehearsal'},20000);e.ingest('a','!grow pond','demo','one',21000);e.ingest('b','!grow nook','demo','two',22000);e.tick(65000);
 assert.equal(e.state.demoGarden.decision!.reason,'tie');assert.throws(()=>e.dispatch({type:'buildGardenChoice',mode:'rehearsal'}));assert.equal(gardenSeeds(e.state.demoGarden),1);assert.equal(e.state.garden.water,0);
 e.dispatch({type:'openGardenVote',mode:'rehearsal'},70000);e.ingest('a','!grow pond','demo','late',116000);e.tick(116000);assert.equal(e.state.demoGarden.decision!.reason,'empty');assert.deepEqual(e.state.garden.landmarks,[]);
});
test('recovery keeps event deduplication, contribution cooldown, and one world choice across restart',()=>{
 const e=new ForgeEngine();grow(e,'twitch');e.dispatch({type:'openGardenVote',mode:'live'},20000);e.ingest('a','!grow pond','twitch','vote',21000);const restored=new ForgeEngine(restoreState(structuredClone(e.state)),e.recovery());
 restored.ingest('a','!grow pond','twitch','vote-again',22000);assert.deepEqual(restored.state.garden.decision!.counts,[1,0,0]);restored.ingest('a','!grow nook','twitch','vote',23000);assert.deepEqual(restored.state.garden.decision!.counts,[1,0,0]);
 restored.ingest('a','!grow nook','twitch','new-id',24000);assert.deepEqual(restored.state.garden.decision!.counts,[0,1,0]);
 restored.dispatch({type:'closeGardenVote',mode:'live'},25000);restored.dispatch({type:'buildGardenChoice',mode:'live'},26000);restored.dispatch({type:'reset'},27000);restored.dispatch({type:'startMoment',scene:{...RECIPES[2].scene,goal:10}},28000);
 const before=restored.state.garden.water;restored.ingest('gardener','!water','twitch','twitch0',29000);assert.equal(restored.state.garden.water,before,'session reset does not re-admit a replay');restored.ingest('other','!water','twitch','new',30000);
 const again=new ForgeEngine(restoreState(structuredClone(restored.state)),restored.recovery());again.ingest('other','!water','twitch','too-soon',31000);assert.equal(again.state.garden.water,before+1);
});
test('a missing or inconsistent world ledger closes a choice without fabricating a winner',()=>{
 const e=new ForgeEngine();grow(e,'demo');e.dispatch({type:'openGardenVote',mode:'rehearsal'},20000);e.ingest('a','!grow pond','demo','vote',21000);
 const without=new ForgeEngine(restoreState(structuredClone(e.state)));assert.equal(without.state.demoGarden.decision!.reason,'recovery');assert.equal(without.state.demoGarden.decision!.winner,null);
});
