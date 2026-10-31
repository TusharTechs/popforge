import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { io, type Socket } from 'socket.io-client';

test('source links survive process restart, source presence is truthful, and replacement revokes old readers', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'popforge-restart-'));
  const origin = 'http://localhost:14318';
  let child: ChildProcess | undefined;
  const sockets: Socket[] = [];
  const start = async () => {
    child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
      env: {
        ...process.env,
        PORT: '14318',
        APP_ORIGIN: origin,
        NODE_ENV: 'production',
        POPFORGE_DATA_DIR: dir,
        TWITCH_CLIENT_ID: '',
        TWITCH_CLIENT_SECRET: '',
        ENABLE_CODEX: 'false',
      },
      stdio: 'ignore',
    });
    for (let n = 0; n < 80; n++) {
      try {
        if ((await fetch(origin + '/api/health')).ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error('Companion failed to start');
  };
  const stop = async () => {
    if (!child || child.exitCode !== null) return;
    const p = child;
    await new Promise<void>((resolve) => {
      p.once('exit', () => resolve());
      p.kill('SIGTERM');
    });
  };
  const connect = async (auth: object, cookie = '') => {
    const socket = io(origin, {
      auth,
      extraHeaders: { Cookie: cookie, Origin: origin },
      transports: ['websocket'],
      reconnection: false,
    });
    sockets.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve());
      socket.once('connect_error', reject);
    });
    return socket;
  };
  try {
    await start();
    const firstResponse = await fetch(origin + '/api/bootstrap');
    const oldCookie = firstResponse.headers.get('set-cookie')!.split(';')[0];
    const first = await firstResponse.json();
    assert.deepEqual(first.sources, { visual: 0, audio: 0 });
    await connect({ viewer: true, surface: 'recap', token: first.overlayToken });
    assert.equal(
      (await (await fetch(origin + '/api/bootstrap')).json()).sources.visual,
      0,
      'recap is not a visual source',
    );
    await connect({ viewer: true, surface: 'overlay', token: first.overlayToken });
    assert.equal((await (await fetch(origin + '/api/bootstrap')).json()).sources.visual, 1);
    await stop();
    await start();
    assert.equal((await fetch(origin + '/api/view?token=' + first.overlayToken)).status, 200);
    const response = await fetch(origin + '/api/bootstrap');
    const second = await response.json();
    assert.equal(second.overlayToken, first.overlayToken);
    assert.equal(second.sources.visual, 0);
    assert.equal(
      (
        await fetch(origin + '/api/overlay/rotate', {
          method: 'POST',
          headers: { Cookie: oldCookie, 'X-Popforge-Request': 'studio' },
        })
      ).status,
      401,
    );
    const cookie = response.headers.get('set-cookie')!.split(';')[0];
    const viewer = await connect({ viewer: true, surface: 'overlay', token: first.overlayToken });
    const disconnected = new Promise((resolve) => viewer.once('disconnect', resolve));
    const rotated = await fetch(origin + '/api/overlay/rotate', {
      method: 'POST',
      headers: { Cookie: cookie, 'X-Popforge-Request': 'studio' },
    });
    assert.equal(rotated.status, 200);
    await disconnected;
    assert.equal((await fetch(origin + '/api/view?token=' + first.overlayToken)).status, 403);
    const third = await (await fetch(origin + '/api/bootstrap')).json();
    assert.notEqual(third.overlayToken, first.overlayToken);
    assert.equal(third.sources.visual, 0);
    assert.equal((await fetch(origin + '/api/view?token=' + third.overlayToken)).status, 200);
    assert.equal('identity' in third, false);
    assert.equal('accessToken' in third.twitch, false);
  } finally {
    for (const s of sockets) s.disconnect();
    await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
