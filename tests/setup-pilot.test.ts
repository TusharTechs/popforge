import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createObsCollection} from '../shared/obs.js';
import {startPilot,completePilotTask,pilotReport} from '../shared/pilot.js';
test('OBS starter includes only read-only video/audio sources and resolves scene item UUIDs',()=>{
 const c=createObsCollection('http://localhost:4317','a'.repeat(64));assert.equal(c.resolution.x,1920);assert.equal(c.sources.length,3);const [picture,audio,scene]=c.sources;const sources=[picture,audio];for(const s of sources){assert.match(s.settings.url!,/\/(overlay|sound)\?token=/);assert.equal('cookie' in s.settings,false);}assert.equal(sources[1].settings.reroute_audio,true);for(const item of scene.settings.items!){assert.ok(sources.some(s=>s.uuid===item.source_uuid));}assert.equal(scene.settings.items![1].pos.x,2000);assert.equal('AuxAudioDevice1' in c,false);assert.throws(()=>createObsCollection('javascript:bad','a'.repeat(64)));assert.throws(()=>createObsCollection('https://user:password@example.com','a'.repeat(64)));assert.throws(()=>createObsCollection('http://localhost:4317','bad'));
});
test('pilot exports retain self-rehearsal labeling, observed timing, help, and uncompleted tasks',()=>{
 let p=startPilot('self-rehearsal','browser-preview',1000);p=completePilotTask(p,'help','Needed help finding the stage.',6500);const report=pilotReport(p);assert.equal(report.mode,'self-rehearsal');assert.equal(report.independentParticipantDeclared,false);assert.equal(report.completionSelfReported,true);assert.equal(report.automaticProductSuccessVerification,false);assert.equal(report.tasks[0].elapsedSeconds,6);assert.equal(report.tasks[1].endedAt,null);assert.equal(report.tasks[1].elapsedSeconds,null);assert.throws(()=>completePilotTask(p,'done','',6000));
});
