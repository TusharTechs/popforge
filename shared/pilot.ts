import { z } from 'zod';
export const PILOT_TASKS = [
  {
    id: 'setup',
    title: 'Find the first step',
    prompt:
      'Open PopForge. Explain which parts work in the browser and what is needed for live Twitch/OBS. Record any confusing label.',
  },
  {
    id: 'moment',
    title: 'Start a community moment',
    prompt:
      'Choose a gentle garden and start it. In browser rehearsal, try five sample contributions. For a live test, use a separate Twitch chatter. Keep the test mode explicit.',
  },
  {
    id: 'world',
    title: 'Leave a place behind',
    prompt:
      'Use the earned seed to open a garden choice. Choose a corner, close the choice, and approve the build. Reload and check that the place is still there.',
  },
  {
    id: 'return',
    title: 'Leave and come back',
    prompt:
      'Take a breather, return, then find the recap. Explain one place the community built and what a newcomer can do next. Try quiet mode.',
  },
] as const;
const Step = z.object({
  id: z.enum(['setup', 'moment', 'world', 'return']),
  startedAt: z.number().finite().nonnegative().nullable(),
  endedAt: z.number().finite().nonnegative().nullable(),
  outcome: z.enum(['pending', 'done', 'help', 'stopped']),
  note: z.string().max(600),
});
export const PilotSchema = z.object({
  version: z.literal(1),
  id: z.string().max(100),
  mode: z.enum(['self-rehearsal', 'independent-creator']),
  environment: z.enum(['browser-preview', 'live-companion']),
  startedAt: z.number().finite().nonnegative(),
  tasks: z.array(Step).length(4),
  feedback: z.string().max(1200),
});
export type Pilot = z.infer<typeof PilotSchema>;
export function startPilot(
  mode: Pilot['mode'],
  environment: Pilot['environment'],
  now = Date.now(),
): Pilot {
  return {
    version: 1,
    id: crypto.randomUUID(),
    mode,
    environment,
    startedAt: now,
    tasks: PILOT_TASKS.map((t, i) => ({
      id: t.id,
      startedAt: i === 0 ? now : null,
      endedAt: null,
      outcome: 'pending',
      note: '',
    })),
    feedback: '',
  };
}
export function completePilotTask(
  pilot: Pilot,
  outcome: 'done' | 'help' | 'stopped',
  note: string,
  now = Date.now(),
): Pilot {
  const p = PilotSchema.parse(pilot);
  const index = p.tasks.findIndex((t) => t.outcome === 'pending');
  if (index < 0) throw new Error('This rehearsal is already complete.');
  const task = p.tasks[index];
  if (task.startedAt === null || now < task.startedAt)
    throw new Error('The task clock is invalid.');
  task.endedAt = now;
  task.outcome = outcome;
  task.note = note.slice(0, 600);
  if (p.tasks[index + 1]) p.tasks[index + 1].startedAt = now;
  return p;
}
export function pilotReport(pilot: Pilot) {
  const p = PilotSchema.parse(pilot);
  return {
    kind: 'PopForge usability observation',
    ...p,
    independentParticipantDeclared: p.mode === 'independent-creator',
    participantIdentityVerified: false,
    completionSelfReported: true,
    automaticProductSuccessVerification: false,
    tasks: p.tasks.map((t) => ({
      ...t,
      elapsedSeconds:
        t.startedAt !== null && t.endedAt !== null
          ? Math.round((t.endedAt - t.startedAt) / 1000)
          : null,
    })),
    limitations: [
      'Outcomes are reported by the observer, not automatically verified.',
      'Time includes reading and any idle time; no hidden telemetry is collected.',
      'Self rehearsal is not an independent creator pilot.',
      'This does not measure viewer retention, audience growth, or concurrent capacity.',
    ],
  };
}
