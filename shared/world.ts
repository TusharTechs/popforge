import { z } from 'zod';
export const LANDMARKS = [
  {
    id: 'pond',
    name: 'Moonpond',
    invitation: 'A quiet pool that catches the light.',
    command: '!grow pond',
    icon: '◒',
  },
  {
    id: 'nook',
    name: 'Reading nook',
    invitation: 'A little seat for the stories we keep.',
    command: '!grow nook',
    icon: '▤',
  },
  {
    id: 'lanterns',
    name: 'Lantern walk',
    invitation: 'A warm path for everyone coming back.',
    command: '!grow lanterns',
    icon: '✦',
  },
] as const;
export const LandmarkSchema = z.enum(['pond', 'nook', 'lanterns']);
export type Landmark = z.infer<typeof LandmarkSchema>;
const DecisionSchema = z
  .object({
    id: z.string().max(100),
    endsAt: z.number().finite(),
    status: z.enum(['open', 'closed', 'built']),
    options: z.array(LandmarkSchema).min(1).max(3),
    counts: z.array(z.number().int().min(0).max(50000)).min(1).max(3),
    winner: LandmarkSchema.nullable(),
    reason: z.enum(['tie', 'empty', 'recovery']).nullable(),
  })
  .refine(
    (d) =>
      d.options.length === d.counts.length &&
      new Set(d.options).size === d.options.length &&
      (!d.winner || d.options.includes(d.winner)),
  );
const CareSchema = z.object({
  id: z.string().max(200),
  at: z.number().finite(),
  kind: z.enum(['water', 'mint', 'moon', 'sunset', 'cheer']),
  plot: z.number().int().min(0).max(23),
});
const ChapterSchema = z.object({
  id: z.string().max(100),
  at: z.number().finite(),
  landmark: LandmarkSchema,
  votes: z.number().int().min(1).max(50000),
});
export const GardenSchema = z
  .object({
    care: z.array(CareSchema).max(12).default([]),
    water: z.number().int().min(0).max(100000000),
    blooms: z.array(z.enum(['mint', 'moon', 'sunset'])).max(24),
    landmarks: z.array(LandmarkSchema).max(3).default([]),
    chapters: z.array(ChapterSchema).max(12).default([]),
    decision: DecisionSchema.nullable().default(null),
  })
  .refine((g) => new Set(g.landmarks).size === g.landmarks.length);
export type GardenMemory = z.infer<typeof GardenSchema>;
export const emptyGarden = (): GardenMemory => ({
  care: [],
  water: 0,
  blooms: [],
  landmarks: [],
  chapters: [],
  decision: null,
});
export const gardenSeeds = (g: GardenMemory) =>
  Math.max(0, Math.floor(g.water / 5) - g.landmarks.length);
export const landmarkName = (id: Landmark) => LANDMARKS.find((x) => x.id === id)!.name;
export function closeGardenDecision(g: GardenMemory) {
  const d = g.decision;
  if (!d || d.status !== 'open') return;
  d.status = 'closed';
  const high = Math.max(...d.counts);
  const tied = d.counts.filter((x) => x === high).length > 1;
  d.winner = high > 0 && !tied ? d.options[d.counts.indexOf(high)] : null;
  d.reason = high === 0 ? 'empty' : tied ? 'tie' : null;
}
