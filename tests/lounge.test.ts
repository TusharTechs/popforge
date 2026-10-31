import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ForgeEngine, initialState, restoreState, recap } from '../shared/engine';

test('old saved sessions migrate without losing scenes or community actions', () => {
  const saved: any = initialState();
  saved.stats.actions = 7;
  delete saved.lounge;
  const restored = restoreState(saved);
  assert.equal(restored.stats.actions, 7);
  assert.equal(restored.scene.name, saved.scene.name);
  assert.equal(restored.lounge.mood, 'starlight');
  assert.deepEqual(restored.lounge.wall, []);
});
test('a breather pauses a round, never auto-returns, then resumes its remaining time', () => {
  const e = new ForgeEngine();
  e.dispatch({ type: 'start' }, 1000);
  e.dispatch({ type: 'takeBreak', duration: 60, message: 'We will be right here.' }, 11000);
  assert.equal(e.state.round.status, 'paused');
  assert.equal(e.state.round.remaining, 170000);
  assert.throws(() => e.dispatch({ type: 'resume' }, 12000));
  assert.throws(() => e.dispatch({ type: 'start' }, 12000));
  e.tick(90000);
  assert.equal(e.state.lounge.break.status, 'resting');
  assert.equal(e.state.round.status, 'paused');
  assert.equal(e.state.stats.rounds, 0);
  e.dispatch({ type: 'returnFromBreak' }, 100000);
  assert.equal(e.state.round.status, 'playing');
  assert.equal(e.state.round.deadline, 270000);
  assert.equal(e.state.lounge.break.status, 'idle');
});
test('a manually paused round stays paused when a breather ends', () => {
  const e = new ForgeEngine();
  e.dispatch({ type: 'start' }, 1000);
  e.dispatch({ type: 'pause' }, 5000);
  e.dispatch({ type: 'takeBreak', duration: 60, message: 'A pause together.' }, 6000);
  e.dispatch({ type: 'returnFromBreak' }, 70000);
  assert.equal(e.state.round.status, 'paused');
  assert.equal(e.state.round.remaining, 176000);
});
test('chat cannot change the atmosphere and can change only its own mood suggestion', () => {
  const e = new ForgeEngine();
  e.ingest('alice', '!vibe aurora', 'demo', 'm1', 1000);
  e.ingest('alice', '!vibe rain', 'demo', 'm2', 1100);
  e.ingest('bob', '!vibe sunset', 'demo', 'm3', 1200);
  assert.deepEqual(e.state.lounge.vibeVotes, [0, 1, 0, 1]);
  assert.equal(e.state.lounge.mood, 'starlight');
  e.dispatch({ type: 'ambience', mood: 'rain' });
  assert.equal(e.state.lounge.mood, 'rain');
});
test('kindness notes stay pending until approval and only approved notes enter lore', () => {
  const e = new ForgeEngine();
  e.ingest('42', '!kind You made today better.', 'twitch', 'note1', 1000, 'KindFriend');
  assert.equal(e.state.lounge.pending.length, 1);
  assert.equal(e.state.lounge.wall.length, 0);
  assert.equal(e.state.events.length, 0);
  assert.equal(e.state.lounge.pending[0].user, 'KindFriend');
  e.dispatch({ type: 'approveKindness', id: 'note1' }, 2000);
  assert.equal(e.state.lounge.wall[0].text, 'You made today better.');
  assert.equal(e.state.lounge.pending.length, 0);
  assert.equal(recap(e.state, 900000, 2100).moments[0].source, 'twitch');
  e.dispatch({ type: 'removeKindness', id: 'note1' });
  assert.equal(e.state.lounge.wall.length, 0);
  assert.ok(
    !recap(e.state, 900000, 3000).moments.some((m) => m.detail.includes('You made today better.')),
  );
});
test('encouragement has cooldown and deduplication while jars preserve persistent progress', () => {
  const e = new ForgeEngine();
  e.ingest('alice', '!heart', 'demo', 'm1', 1000);
  e.ingest('alice', '!heart', 'demo', 'm1', 6000);
  e.ingest('alice', '!heart', 'demo', 'm2', 2000);
  assert.equal(e.state.lounge.hearts, 1);
  for (let i = 0; i < 11; i++) e.ingest('alice', '!heart', 'demo', `heart${i}`, 6000 + i * 4100);
  assert.equal(e.state.lounge.hearts, 12);
  assert.equal(e.state.lounge.jars, 1);
  assert.ok(e.state.events.some((e) => e.title === 'Chat filled a kindness jar'));
});
test('quiet mode suppresses bursts but keeps community contributions and game history', () => {
  const e = new ForgeEngine();
  e.dispatch({ type: 'ambience', energy: 'quiet' });
  e.ingest('friend', '!heart', 'demo', 'm1', 1000);
  e.ingest('friend', '!glow', 'demo', 'm2', 6000);
  e.dispatch({ type: 'celebrate', kind: 'confetti' }, 7000);
  assert.equal(e.state.lounge.hearts, 1);
  assert.equal(e.state.lounge.lanterns, 1);
  assert.deepEqual(e.state.lounge.effects, []);
});
test('a crowd cannot create an unbounded particle burst or moderation queue', () => {
  const e = new ForgeEngine();
  for (let i = 0; i < 200; i++) {
    e.ingest(`a${i}`, '!hype', 'demo', `fx${i}`, 1000);
    e.ingest(`b${i}`, '!kind Keep going, we are here!', 'demo', `kind${i}`, 1000);
  }
  assert.ok(e.state.lounge.effects.length <= 4);
  assert.equal(e.state.lounge.pending.length, 12);
  assert.ok(e.state.chat.length <= 50);
});
test('breather recaps invite support and keyword heat does not build during a break', () => {
  const e = new ForgeEngine();
  e.dispatch({ type: 'takeBreak', duration: 60, message: 'Keep the lights on.' }, 1000);
  const before = e.state.charge;
  e.ingest('a', 'unlucky', 'demo', 'm1', 2000);
  assert.equal(e.state.charge, before);
  assert.match(recap(e.state, 900000, 3000).action, /!glow/);
});
