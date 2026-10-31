import { z } from 'zod';

export const MoodSchema = z.enum(['starlight', 'rain', 'aurora', 'sunset']);
export const EnergySchema = z.enum(['gentle', 'balanced', 'party', 'quiet']);
export const EffectSchema = z.enum(['hearts', 'stars', 'confetti', 'lanterns']);
export type Mood = z.infer<typeof MoodSchema>;
export type Energy = z.infer<typeof EnergySchema>;
export type EffectKind = z.infer<typeof EffectSchema>;
export const MOODS: {
  id: Mood;
  name: string;
  description: string;
  emoji: string;
  command: string;
  colors: [string, string, string];
  bpm: number;
}[] = [
  {
    id: 'starlight',
    name: 'Starlit hideaway',
    description: 'Soft keys. A sky full of little possibilities.',
    emoji: '✦',
    command: '!vibe starlight',
    colors: ['#101c2e', '#546991', '#e9d8aa'],
    bpm: 68,
  },
  {
    id: 'rain',
    name: 'Rainy window',
    description: 'Warm lights. Gentle rain. Nowhere else to be.',
    emoji: '☂',
    command: '!vibe rain',
    colors: ['#192b30', '#5c8386', '#edc892'],
    bpm: 62,
  },
  {
    id: 'aurora',
    name: 'Aurora drift',
    description: 'Floating colors and a slower kind of magic.',
    emoji: '≈',
    command: '!vibe aurora',
    colors: ['#112a29', '#60b69f', '#cbb6f1'],
    bpm: 72,
  },
  {
    id: 'sunset',
    name: 'Golden-hour arcade',
    description: 'Warm synths with a little main-character energy.',
    emoji: '☀',
    command: '!vibe sunset',
    colors: ['#3a2737', '#be7e94', '#f5c38a'],
    bpm: 86,
  },
];
const KindnessSchema = z.object({
  id: z.string(),
  user: z.string().max(40),
  text: z.string().max(160),
  at: z.number(),
  source: z.enum(['demo', 'twitch']),
});
export type Kindness = z.infer<typeof KindnessSchema>;
export const LoungeSchema = z.object({
  mood: MoodSchema,
  energy: EnergySchema,
  particles: z.boolean(),
  intensity: z.number().min(0).max(1),
  showBackground: z.boolean(),
  hearts: z.number().int().nonnegative(),
  stars: z.number().int().nonnegative(),
  lanterns: z.number().int().nonnegative(),
  jars: z.number().int().nonnegative(),
  effects: z
    .array(
      z.object({ id: z.string(), kind: EffectSchema, at: z.number(), user: z.string().max(40) }),
    )
    .max(12),
  pending: z.array(KindnessSchema).max(12),
  wall: z.array(KindnessSchema).max(9),
  vibeVotes: z.tuple([
    z.number().nonnegative(),
    z.number().nonnegative(),
    z.number().nonnegative(),
    z.number().nonnegative(),
  ]),
  break: z.object({
    status: z.enum(['idle', 'running', 'resting']),
    deadline: z.number(),
    duration: z.number(),
    message: z.string().max(120),
    pausedRoundId: z.string().nullable(),
  }),
});
export type LoungeState = z.infer<typeof LoungeSchema>;
export const initialLounge = (): LoungeState => ({
  mood: 'starlight',
  energy: 'gentle',
  particles: true,
  intensity: 0.45,
  showBackground: false,
  hearts: 0,
  stars: 0,
  lanterns: 0,
  jars: 0,
  effects: [],
  pending: [],
  wall: [],
  vibeVotes: [0, 0, 0, 0],
  break: {
    status: 'idle',
    deadline: 0,
    duration: 120,
    message: 'Take your time. We’re keeping the lights on.',
    pausedRoundId: null,
  },
});
export function restoreLounge(raw: unknown): LoungeState {
  const result = LoungeSchema.safeParse(raw);
  return result.success ? result.data : initialLounge();
}
export const BREAK_MESSAGES = [
  'Take your time. We’re keeping the lights on.',
  'A little pause. The story will be right here.',
  'Stretch, sip, and come back when you’re ready.',
];
export const jarProgress = (hearts: number) => hearts % 12;
export const breakActive = (s: LoungeState) => s.break.status !== 'idle';
