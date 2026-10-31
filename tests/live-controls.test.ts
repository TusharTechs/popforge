import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ForgeEngine, RECIPES } from '../shared/engine.js';
test('one-click gentle moment is atomic, visible, and playable by a single chatter', () => {
  const engine = new ForgeEngine();
  engine.dispatch({ type: 'settings', compact: true, reducedMotion: true });
  engine.dispatch({ type: 'ambience', showBackground: true });
  engine.dispatch(
    { type: 'startMoment', scene: { ...RECIPES[2].scene, goal: 5, duration: 60 } },
    1000,
  );
  assert.equal(engine.state.round.status, 'playing');
  assert.equal(engine.state.settings.compact, false);
  assert.equal(engine.state.settings.reducedMotion, true);
  assert.equal(engine.state.lounge.showBackground, false);
  for (let n = 0; n < 5; n++)
    engine.ingest('one-viewer', '!water', 'twitch', String(n), 2000 + n * 3100);
  engine.tick(62000);
  assert.equal(engine.state.round.outcome, 'saved');
  assert.equal(engine.state.round.participants, 1);
});
test('live controls do not replace an active moment and end both a breather and paused game', () => {
  const engine = new ForgeEngine();
  engine.dispatch({ type: 'startMoment', scene: RECIPES[2].scene }, 1000);
  const scene = engine.state.scene;
  assert.throws(
    () => engine.dispatch({ type: 'startMoment', scene: RECIPES[1].scene }, 2000),
    /End the current/,
  );
  assert.deepEqual(engine.state.scene, scene);
  engine.dispatch({ type: 'takeBreak', duration: 60, message: 'A little pause' }, 3000);
  assert.equal(engine.state.round.status, 'paused');
  engine.dispatch({ type: 'endActivity' }, 4000);
  assert.equal(engine.state.round.status, 'idle');
  assert.equal(engine.state.lounge.break.status, 'idle');
});
