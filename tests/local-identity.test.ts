import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LocalIdentity, type RememberedTwitch } from '../server/local-identity.js';
const credential: RememberedTwitch = {
  clientId: 'fake-client',
  userId: 'creator-id',
  token: {
    accessToken: 'fake-access-sensitive',
    refreshToken: 'fake-refresh-sensitive',
    scope: ['user:read:chat', 'user:write:chat'],
    expiresIn: 3600,
    obtainmentTimestamp: 1234,
  },
};

test('saved identity survives restart, encrypts credentials, and retains the overlay when Twitch is forgotten', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'popforge-identity-'));
  try {
    const first = new LocalIdentity(dir);
    const link = first.overlayToken;
    first.save(credential);
    assert.equal(
      readFileSync(path.join(dir, 'identity.enc')).includes(
        Buffer.from(credential.token.accessToken),
      ),
      false,
    );
    assert.equal(
      readFileSync(path.join(dir, 'identity.enc')).includes(
        Buffer.from(credential.token.refreshToken!),
      ),
      false,
    );
    assert.equal(statSync(path.join(dir, 'identity.enc')).mode & 0o777, 0o600);
    assert.equal(statSync(path.join(dir, 'identity.key')).mode & 0o777, 0o600);
    assert.equal(statSync(dir).mode & 0o777, 0o700);
    const second = new LocalIdentity(dir);
    assert.equal(second.overlayToken, link);
    assert.deepEqual(second.load(), credential);
    const rotated = {
      ...credential,
      token: { ...credential.token, refreshToken: 'replacement-refresh' },
    };
    second.save(rotated);
    const third = new LocalIdentity(dir);
    assert.deepEqual(third.load(), rotated);
    third.clear();
    const fourth = new LocalIdentity(dir);
    assert.equal(fourth.load(), null);
    assert.equal(fourth.overlayToken, link);
    const next = fourth.rotateOverlay();
    assert.notEqual(next, link);
    assert.equal(new LocalIdentity(dir).overlayToken, next);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('damaged or missing identity keys fail closed without silently replacing source links', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'popforge-identity-'));
  try {
    new LocalIdentity(dir).save(credential);
    const encrypted = readFileSync(path.join(dir, 'identity.enc'));
    const changed = Buffer.from(encrypted);
    changed[30] ^= 1;
    writeFileSync(path.join(dir, 'identity.enc'), changed);
    assert.throws(() => new LocalIdentity(dir), /could not read/);
    writeFileSync(path.join(dir, 'identity.enc'), encrypted);
    rmSync(path.join(dir, 'identity.key'));
    assert.throws(() => new LocalIdentity(dir), /cannot unlock/);
    assert.deepEqual(readFileSync(path.join(dir, 'identity.enc')), encrypted);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
