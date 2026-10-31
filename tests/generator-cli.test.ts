import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveCodexCli } from '../server/generator.js';
test('CLI selection respects an explicit executable and safely falls back when PATH has none', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'popforge-cli-'));
  try {
    const executable = path.join(dir, 'codex');
    writeFileSync(executable, '#!/bin/sh\nexit 0\n', { mode: 0o700 });
    assert.equal(
      resolveCodexCli(path.resolve('node_modules/.bin') + path.delimiter + dir, ''),
      executable,
    );
    assert.equal(resolveCodexCli(dir, ''), executable);
    assert.equal(resolveCodexCli('', executable), executable);
    assert.equal(resolveCodexCli('', ''), undefined);
    assert.throws(() => resolveCodexCli('', path.join(dir, 'missing')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
