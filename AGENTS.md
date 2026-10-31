# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## What PopForge is

A local, single-broadcaster companion for Twitch. Viewers act through Twitch chat commands (EventSub), the creator drives the studio or the compact OBS dock, and OBS shows a trusted Canvas overlay. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module map and sequence diagrams.

## Layout

| Path | Contents |
| --- | --- |
| `shared/` | Pure, framework-free state: `engine.ts` (scenes, rounds, garden, polls, recaps), `world.ts`, `lounge.ts`, `relay.ts`, `obs.ts`, `pilot.ts` |
| `server/` | Express + Socket.io host, Twitch OAuth/EventSub (`twitch.ts`), Codex SDK scene generation (`generator.ts`), encrypted identity, atomic runtime store |
| `src/` | React studio, OBS source and dock routes, Canvas renderer (`renderer.ts`) |
| `tests/` | Node test runner suites executed through `tsx` |
| `scripts/` | Local verification, transport rehearsal, music synthesis |

## Commands

```sh
npm ci                 # install from the lockfile
npm run dev            # companion + Vite on http://localhost:4317
npm test               # all regression tests
npm run typecheck      # tsc --noEmit
npm run format         # Prettier
npm run build          # typecheck + production bundle
```

Run `npm run format:check`, `npm test`, and `npm run build` before finishing a change; CI runs the same steps.

## Rules that must hold

- **Never execute generated code.** Codex SDK output is a scene specification validated by `SceneSchema` (Zod) and rendered by trusted code in `src/renderer.ts`. Add new mechanics as trusted renderer code plus schema values, not as generated scripts.
- **Keep the generator sandboxed.** `server/generator.ts` runs Codex with a read-only sandbox, no network, no web search, an isolated working directory, and Twitch secrets stripped from the environment. Do not loosen these.
- **Respect the role split.** Studio controls use the local HttpOnly session; OBS visual/audio sources use a separate read-only token and must never mutate state.
- **Live and rehearsal state stay separate.** Synthetic or browser-preview contributions must not change the live garden, seeds, or landmarks.
- **Creator approval gates the stream.** Chat proposals, mood suggestions, kindness notes, and world builds wait for the creator before they reach OBS.
- **Bind to `127.0.0.1`.** The companion is not a public server.
- **No secrets in the repo.** Configuration comes from `.env` (see `.env.example`); `.data/` holds local identity and state and is gitignored.

## Style

- TypeScript ES modules with `.js` import specifiers in `shared/` and `server/`.
- Prettier formats the code (single quotes, 100 columns); do not hand-format.
- Add or update a test in `tests/` for every engine, persistence, or authorization change.
