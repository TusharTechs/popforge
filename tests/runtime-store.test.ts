import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { RuntimeStore } from '../server/runtime-store.js';
import { ForgeEngine } from '../shared/engine.js';
test('runtime checkpoints atomically retain state and private ledgers with owner-only permissions', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'popforge-runtime-'));
  try {
    const store = new RuntimeStore(dir);
    assert.equal(store.load(), null);
    const e = new ForgeEngine();
    e.ingest('a', '!heart', 'twitch', 'event-one', 10000);
    store.save(e);
    const saved = store.load()!;
    const returned = new ForgeEngine(saved.state, saved.recovery);
    returned.ingest('a', '!heart', 'twitch', 'event-one', 20000);
    assert.equal(returned.state.lounge.hearts, 1);
    assert.equal(statSync(path.join(dir, 'runtime.json')).mode & 0o777, 0o600);
    assert.equal(statSync(dir).mode & 0o777, 0o700);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test('a damaged runtime checkpoint fails closed and preserves the original bytes', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'popforge-runtime-'));
  try {
    const store = new RuntimeStore(dir);
    store.save(new ForgeEngine());
    const file = path.join(dir, 'runtime.json');
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    raw.payload.state.garden.water = 999;
    writeFileSync(file, JSON.stringify(raw));
    const damaged = readFileSync(file, 'utf8');
    assert.throws(() => store.load(), /could not read/);
    assert.equal(readFileSync(file, 'utf8'), damaged);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
