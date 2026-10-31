import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RelayEngine, relayScores, runRelayLoad, relayLore } from '../shared/relay.js';
const start = () => {
  const e = new RelayEngine('rehearsal');
  e.act('host', { type: 'approve' }, 0);
  e.act('guest', { type: 'approve' }, 0);
  e.act('host', { type: 'start' }, 100);
  return e;
};
test('Relay requires independent approvals and limits episode operation to the host', () => {
  const e = new RelayEngine('live');
  assert.throws(() => e.act('host', { type: 'start' }), /Both creators/);
  e.act('host', { type: 'approve' });
  assert.equal(e.state.phase, 'inviting');
  assert.throws(() => e.act('host', { type: 'start' }), /Both creators/);
  e.act('guest', { type: 'approve' });
  assert.equal(e.state.phase, 'ready');
  assert.throws(() => e.act('guest', { type: 'start' }), /Only the host/);
  assert.throws(() => e.act('host', { type: 'handoff' }), /Finish/);
  e.act('host', { type: 'start' });
  assert.equal(e.state.phase, 'playing');
});
test('50,000 host participants cannot outweigh five guest participants', () => {
  const { state, report } = runRelayLoad(50000, 5);
  assert.deepEqual(report.scores, [50, 50, 0]);
  assert.equal(report.accepted, 50005);
  assert.equal(report.events, 100013);
  assert.ok(report.checks.every((c) => c.passed));
  assert.equal(state.winner, null);
});
test('Relay counts an account once across communities and rejects malformed, broadcaster and duplicate messages', () => {
  const e = start();
  e.ingest('host', 'same', '!relay 1', 'one', 101);
  e.ingest('guest', 'same', '!relay 2', 'two', 102);
  e.ingest('host', 'other', '!relay 1', 'one', 103);
  e.ingest('host', 'bad', '!relay 4', 'bad', 104);
  e.ingest('guest', 'streamer', '!relay 2', 'streamer', 105, true);
  assert.equal(e.state.votes, 1);
  assert.deepEqual(e.state.counts, { host: [1, 0, 0], guest: [0, 0, 0] });
  assert.equal(e.state.duplicateEvents, 1);
  assert.equal(e.state.ignored, 3);
  assert.deepEqual(relayScores(e.state), [50, 0, 0]);
});
test('pause, reconnect-style resume, and deadline reject stale input without inventing participation', () => {
  const e = start();
  e.act('host', { type: 'pause' }, 1100);
  assert.equal(e.state.remaining, 119000);
  e.ingest('guest', 'paused', '!relay 2', 'p', 1200);
  assert.equal(e.state.votes, 0);
  e.act('host', { type: 'resume' }, 5000);
  assert.equal(e.state.deadline, 124000);
  e.ingest('host', 'late', '!relay 1', 'late', 124001);
  assert.equal(e.state.votes, 0);
  e.tick(124001);
  assert.equal(e.state.phase, 'finished');
  assert.equal(e.state.winner, null);
  assert.throws(() => e.act('host', { type: 'resume' }), /paused time/);
});
test('either creator can withdraw approval, stopping choices and blocking the handoff', () => {
  const e = start();
  e.act('guest', { type: 'revoke' }, 500);
  assert.equal(e.state.phase, 'inviting');
  e.ingest('host', 'u', '!relay 1', 'x', 501);
  assert.equal(e.state.votes, 0);
  assert.throws(() => e.act('host', { type: 'handoff' }), /Both creators/);
  e.act('guest', { type: 'approve' }, 600);
  assert.equal(e.state.phase, 'ready');
  e.act('host', { type: 'start' }, 700);
  assert.equal(e.state.votes, 0);
});
test('a completed episode produces grounded lore and a separately approved handoff', () => {
  const e = start();
  e.ingest('host', 'a', '!relay 2', 'a', 101);
  e.ingest('guest', 'b', '!relay 2', 'b', 102);
  e.act('host', { type: 'finish' }, 103);
  assert.equal(e.state.winner, 1);
  assert.match(relayLore(e.state)[1], /space frog/);
  assert.equal(e.state.phase, 'finished');
  e.act('host', { type: 'handoff' }, 104);
  assert.equal(e.state.phase, 'handoff');
  assert.match(e.state.history[0].text, /manual/);
});
test('load simulator rejects unbounded or non-integer populations', () => {
  for (const n of [0, -1, 1.5, 100000, NaN]) assert.throws(() => runRelayLoad(n, 5));
});
