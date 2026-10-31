import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import { installRelay } from '../server/relay.js';
import type { TwitchBridge } from '../server/twitch.js';

class MockBridge {
  status = {
    configured: true,
    connected: true,
    listening: true,
    name: 'Host',
    category: 'Art',
    error: null as string | null,
  };
  accountId: string | undefined = 'host-id';
  onChat?: (e: {
    userId: string;
    text: string;
    messageId: string;
    at: number;
    isBroadcaster: boolean;
  }) => void;
  async connect(code: string) {
    this.accountId = code;
    this.status = {
      ...this.status,
      connected: true,
      listening: true,
      name: code === 'host-id' ? 'Host' : 'Guest',
    };
  }
  disconnect() {
    this.accountId = undefined;
    this.status = { ...this.status, connected: false, listening: false, name: '' };
  }
}
test('Relay HTTP invitations, independent approval, event routing and reconnect pauses', async () => {
  const app = express();
  app.use(express.json());
  const host = new MockBridge(),
    guest = new MockBridge();
  guest.disconnect();
  const control: express.RequestHandler = (req, res, next) =>
    req.headers['x-test-host'] === 'yes' ? next() : res.status(401).json({ error: 'host only' });
  const relay = installRelay(
    app,
    control,
    host as unknown as TwitchBridge,
    'http://localhost',
    guest as unknown as TwitchBridge,
  );
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  const base = `http://127.0.0.1:${address.port}`;
  const get = (path: string, headers: Record<string, string> = {}) =>
    fetch(base + path, { headers, redirect: 'manual' });
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-popforge-request': 'studio', ...headers },
      body: JSON.stringify(body),
      redirect: 'manual',
    });
  try {
    assert.equal((await get('/api/relay')).status, 401);
    assert.equal((await get('/api/relay/guest')).status, 401);
    const setup = {
      title: 'Build a moon creature',
      host: { name: 'Host', talent: 'Creates magical worlds' },
      guest: { name: 'Guest', talent: 'Makes beautiful artwork' },
    };
    const created = await post('/api/relay', setup, { 'x-test-host': 'yes' });
    assert.equal(created.status, 200);
    const invite = new URL((await created.json()).inviteUrl).searchParams.get('invite');
    assert.ok(invite);
    assert.equal((await post('/api/relay/join', { invite: 'wrong' })).status, 403);
    const joined = await post('/api/relay/join', { invite });
    assert.equal(joined.status, 200);
    const cookie = joined.headers.get('set-cookie')!.split(';')[0];
    assert.equal((await post('/api/relay/join', { invite })).status, 403);
    assert.equal(
      (await post('/api/relay/action', { type: 'approve' }, { Cookie: cookie })).status,
      401,
    );
    assert.equal(
      (await post('/api/relay/guest/action', { type: 'approve' }, { Cookie: cookie })).status,
      400,
    );
    const login = await get('/auth/twitch/relay', { Cookie: cookie });
    const oauth = new URL(login.headers.get('location')!);
    const oauthState = oauth.searchParams.get('state');
    assert.ok(oauthState);
    assert.equal(
      (await get(`/auth/twitch/callback?state=${oauthState}&code=guest-id`, { Cookie: cookie }))
        .status,
      302,
    );
    assert.equal(
      (await post('/api/relay/action', { type: 'approve' }, { 'x-test-host': 'yes' })).status,
      200,
    );
    assert.equal(
      (await post('/api/relay/action', { type: 'start' }, { 'x-test-host': 'yes' })).status,
      400,
    );
    assert.equal(
      (await post('/api/relay/guest/action', { type: 'approve' }, { Cookie: cookie })).status,
      200,
    );
    assert.equal(
      (await post('/api/relay/action', { type: 'start' }, { 'x-test-host': 'yes' })).status,
      200,
    );
    host.onChat!({
      userId: 'viewer1',
      text: '!relay 1',
      messageId: 'a',
      at: Date.now(),
      isBroadcaster: false,
    });
    guest.onChat!({
      userId: 'viewer2',
      text: '!relay 2',
      messageId: 'b',
      at: Date.now(),
      isBroadcaster: false,
    });
    let state = await (await get('/api/relay', { 'x-test-host': 'yes' })).json();
    assert.equal(state.state.votes, 2);
    assert.deepEqual(state.state.counts, { host: [1, 0, 0], guest: [0, 1, 0] });
    host.disconnect();
    state = await (await get('/api/relay', { 'x-test-host': 'yes' })).json();
    assert.equal(state.state.phase, 'paused');
    assert.equal(state.state.votes, 2);
    await host.connect('host-id');
    assert.equal(
      (await post('/api/relay/action', { type: 'resume' }, { 'x-test-host': 'yes' })).status,
      200,
    );
    assert.equal(
      (await post('/api/relay/guest/action', { type: 'revoke' }, { Cookie: cookie })).status,
      200,
    );
    state = await (await get('/api/relay', { 'x-test-host': 'yes' })).json();
    assert.equal(state.state.phase, 'inviting');
  } finally {
    relay.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
