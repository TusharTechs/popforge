import { z } from 'zod';

export type RelaySide = 'host' | 'guest';
export type RelayMode = 'rehearsal' | 'live';
export type RelayPhase = 'inviting' | 'ready' | 'playing' | 'paused' | 'finished' | 'handoff';
export const CreatorSchema = z.object({
  name: z.string().trim().min(2).max(40),
  talent: z.string().trim().min(5).max(140),
});
export const RelaySetupSchema = z.object({
  title: z.string().trim().min(5).max(100),
  host: CreatorSchema,
  guest: CreatorSchema,
});
export type RelaySetup = z.infer<typeof RelaySetupSchema>;
export const RELAY_DEMO: RelaySetup = {
  title: 'The moon needs a new guardian',
  host: { name: 'Moonbase Club', talent: 'Turns impossible missions into community adventures.' },
  guest: { name: 'Little Lantern', talent: 'Builds tiny worlds and invents wonderful creatures.' },
};
export const RELAY_CHOICES = [
  'A dragon made of starlight',
  'A very brave space frog',
  'A sleepy cosmic cat',
];
export type RelayState = {
  id: string;
  mode: RelayMode;
  phase: RelayPhase;
  title: string;
  creators: Record<RelaySide, { name: string; talent: string; approved: boolean }>;
  counts: Record<RelaySide, number[]>;
  votes: number;
  duplicateEvents: number;
  ignored: number;
  deadline: number;
  remaining: number;
  winner: number | null;
  history: { at: number; text: string }[];
};
export const RelayActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('approve') }),
  z.object({ type: z.literal('revoke') }),
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('pause') }),
  z.object({ type: z.literal('resume') }),
  z.object({ type: z.literal('finish') }),
  z.object({ type: z.literal('handoff') }),
]);
export type RelayAction = z.infer<typeof RelayActionSchema>;
export function relayScores(state: RelayState) {
  // Each community owns half the decision. An empty community contributes nothing;
  // its unused influence is never transferred to the larger community.
  return RELAY_CHOICES.map((_, i) =>
    (['host', 'guest'] as const).reduce((sum, side) => {
      const total = state.counts[side].reduce((a, b) => a + b, 0);
      return sum + (total ? (state.counts[side][i] / total) * 50 : 0);
    }, 0),
  );
}
export function relayLore(state: RelayState) {
  return [
    `${state.creators.host.name} and ${state.creators.guest.name} are creating a moon guardian together.`,
    state.winner === null
      ? 'Each chat chooses with !relay 1, !relay 2, or !relay 3. Each community has half the influence.'
      : `The communities chose: ${RELAY_CHOICES[state.winner]}.`,
    `Meet ${state.creators.guest.name}: ${state.creators.guest.talent}`,
  ];
}
export class RelayEngine {
  state: RelayState;
  private voters = new Set<string>();
  private messages = new Set<string>();
  constructor(mode: RelayMode, setup: RelaySetup = RELAY_DEMO, now = Date.now()) {
    const s = RelaySetupSchema.parse(setup);
    this.state = {
      id: crypto.randomUUID(),
      mode,
      phase: 'inviting',
      title: s.title,
      creators: { host: { ...s.host, approved: false }, guest: { ...s.guest, approved: false } },
      counts: { host: [0, 0, 0], guest: [0, 0, 0] },
      votes: 0,
      duplicateEvents: 0,
      ignored: 0,
      deadline: 0,
      remaining: 120000,
      winner: null,
      history: [
        {
          at: now,
          text:
            mode === 'rehearsal'
              ? 'Rehearsal created. All participants are simulated.'
              : 'Invitation prepared. Both creators must approve.',
        },
      ],
    };
  }
  private record(text: string, now: number) {
    this.state.history = [{ at: now, text }, ...this.state.history].slice(0, 12);
  }
  act(side: RelaySide, input: unknown, now = Date.now()) {
    const action = RelayActionSchema.parse(input);
    const s = this.state;
    if (action.type === 'approve') {
      if (!['inviting', 'ready'].includes(s.phase))
        throw new Error('Approve before starting the episode.');
      s.creators[side].approved = true;
      s.phase = s.creators.host.approved && s.creators.guest.approved ? 'ready' : 'inviting';
      this.record(
        `${s.creators[side].name} approved the introduction and active collaboration.`,
        now,
      );
    } else if (action.type === 'revoke') {
      if (s.phase === 'playing') s.remaining = Math.max(0, s.deadline - now);
      s.creators[side].approved = false;
      s.phase = 'inviting';
      this.record(`${s.creators[side].name} withdrew approval. The episode stopped.`, now);
    } else {
      if (side !== 'host') throw new Error('Only the host can operate the episode.');
      if (!s.creators.host.approved || !s.creators.guest.approved)
        throw new Error('Both creators must approve first.');
      if (action.type === 'start') {
        if (s.phase !== 'ready') throw new Error('This episode is not ready to start.');
        s.counts = { host: [0, 0, 0], guest: [0, 0, 0] };
        s.votes = 0;
        s.winner = null;
        s.remaining = 120000;
        s.deadline = now + s.remaining;
        s.phase = 'playing';
        this.voters.clear();
        this.messages.clear();
        this.record('Both communities are choosing their moon guardian.', now);
      } else if (action.type === 'pause') {
        if (s.phase !== 'playing') throw new Error('There is no running episode to pause.');
        s.remaining = Math.max(0, s.deadline - now);
        s.phase = 'paused';
        this.record('Episode paused. Chat choices are on hold.', now);
      } else if (action.type === 'resume') {
        if (s.phase !== 'paused' || s.remaining <= 0)
          throw new Error('There is no paused time to resume.');
        s.deadline = now + s.remaining;
        s.phase = 'playing';
        this.record('Episode resumed.', now);
      } else if (action.type === 'finish') {
        if (!['playing', 'paused'].includes(s.phase)) throw new Error('Start the episode first.');
        this.finish(now);
      } else if (action.type === 'handoff') {
        if (s.phase !== 'finished')
          throw new Error('Finish the episode before preparing a handoff.');
        s.phase = 'handoff';
        this.record('Host approved the handoff. Twitch raid remains a manual action.', now);
      }
    }
    return this.state;
  }
  ingest(
    side: RelaySide,
    userId: string,
    text: string,
    messageId: string,
    now = Date.now(),
    isBroadcaster = false,
  ) {
    const s = this.state;
    if (!/^!relay\b/i.test(text.trim())) return;
    if (this.messages.has(messageId)) {
      s.duplicateEvents++;
      return;
    }
    // Bounded for a two-minute prototype: reject overload rather than evict IDs and recount replays.
    if (this.messages.size >= 200000) {
      s.ignored++;
      return;
    }
    this.messages.add(messageId);
    if (isBroadcaster || s.phase !== 'playing' || now >= s.deadline) {
      s.ignored++;
      return;
    }
    const match = text.trim().match(/^!relay\s+([123])$/i);
    const key = userId; // A Twitch account gets one vote across the entire episode.
    if (!match || !userId || this.voters.has(key) || this.voters.size >= 100000) {
      s.ignored++;
      return;
    }
    this.voters.add(key);
    s.counts[side][Number(match[1]) - 1]++;
    s.votes++;
  }
  tick(now = Date.now()) {
    if (this.state.phase === 'playing' && now >= this.state.deadline) {
      this.finish(now);
      return true;
    }
    return false;
  }
  private finish(now: number) {
    const s = this.state;
    const scores = relayScores(s);
    const best = Math.max(...scores);
    const leaders = scores.flatMap((v, i) => (Math.abs(v - best) < 0.000001 ? [i] : []));
    s.winner = best > 0 && leaders.length === 1 ? leaders[0] : null;
    s.phase = 'finished';
    s.remaining = 0;
    this.record(
      s.winner === null
        ? 'Episode closed with no single winner. Creators can decide together.'
        : `The communities chose ${RELAY_CHOICES[s.winner]}.`,
      now,
    );
  }
}
export type RelayLoadReport = {
  hostParticipants: number;
  guestParticipants: number;
  events: number;
  accepted: number;
  duplicates: number;
  ignored: number;
  elapsedMs: number;
  eventsPerSecond: number;
  checks: { name: string; passed: boolean }[];
  scores: number[];
};
export function runRelayLoad(
  hostParticipants: number,
  guestParticipants: number,
): { state: RelayState; report: RelayLoadReport } {
  if (
    !Number.isInteger(hostParticipants) ||
    !Number.isInteger(guestParticipants) ||
    hostParticipants < 1 ||
    guestParticipants < 1 ||
    hostParticipants + guestParticipants > 100000
  )
    throw new Error('Choose 1–100,000 total synthetic participants.');
  const now = 1000000;
  const e = new RelayEngine('rehearsal', RELAY_DEMO, now);
  e.act('host', { type: 'approve' }, now);
  e.act('guest', { type: 'approve' }, now);
  e.act('host', { type: 'start' }, now);
  const started = performance.now();
  let events = 0;
  for (const side of ['host', 'guest'] as const) {
    const n = side === 'host' ? hostParticipants : guestParticipants;
    for (let i = 0; i < n; i++) {
      const id = `load-${side}-${i}`;
      const text = `!relay ${side === 'host' ? 1 : 2}`;
      e.ingest(side, id, text, id, now + 1);
      e.ingest(side, id, text, id, now + 1);
      events += 2;
    }
  }
  e.ingest('host', 'broadcaster', '!relay 1', 'broadcaster', now + 2, true);
  events++;
  e.act('host', { type: 'pause' }, now + 2);
  e.ingest('guest', 'paused', '!relay 3', 'paused', now + 3);
  events++;
  const before = e.state.votes;
  e.act('host', { type: 'resume' }, now + 4);
  e.ingest('guest', 'late', '!relay 3', 'late', e.state.deadline + 1);
  events++;
  const elapsedMs = performance.now() - started;
  const scores = relayScores(e.state);
  e.tick(e.state.deadline + 1);
  return {
    state: e.state,
    report: {
      hostParticipants,
      guestParticipants,
      events,
      accepted: e.state.votes,
      duplicates: e.state.duplicateEvents,
      ignored: e.state.ignored,
      elapsedMs,
      eventsPerSecond: Math.round(events / Math.max(elapsedMs / 1000, 0.001)),
      scores,
      checks: [
        {
          name: 'Each community retains 50% influence',
          passed: scores[0] === 50 && scores[1] === 50,
        },
        {
          name: 'Duplicate deliveries counted once',
          passed: e.state.duplicateEvents === hostParticipants + guestParticipants,
        },
        {
          name: 'Broadcaster excluded from audience choices',
          passed: e.state.votes === hostParticipants + guestParticipants,
        },
        {
          name: 'Paused and late messages rejected',
          passed: before === e.state.votes && e.state.ignored === 3,
        },
        { name: 'Deadline closes the episode', passed: e.state.phase === 'finished' },
        { name: 'Tie does not fabricate a winner', passed: e.state.winner === null },
      ],
    },
  };
}
