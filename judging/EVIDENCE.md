# PopForge evidence ledger

Reviewed **30 October 2026**. This ledger distinguishes observed behavior, automated checks, and work that has not been exercised. [README](../README.md) · [Architecture](../docs/ARCHITECTURE.md) · [Final review](FINAL_REVIEW.md)

## Automated verification

| Check | Result | Reproduce / scope |
| --- | --- | --- |
| Test suite | **41 passed; 0 failed, skipped, or cancelled** | `npm test`; Node test runner through tsx |
| Type checking and production build | **Passed** | `npm run build`; TypeScript + Vite |
| Clean source installation | **Passed** | Fresh tracked-source archive, `npm ci`, build, and all 41 tests; no `.env` or `.data` copied |
| Dependency audit | **0 known vulnerabilities reported** | `npm audit` on the locked dependency set; time-specific registry advisory check, not a security certification |
| Build performance note | **Warning remains** | Main minified JavaScript chunk approximately 541 KB / 166 KB gzip; optional feature code splitting remains future work |

Tests cover engine deadlines/outcomes, cooldowns, deduplication, poll changes, rollback, scene bounds, grounded recaps, gentle single-chatter participation, garden persistence and rehearsal separation, explicit focus completion, kindness approval/withdrawal, quiet-mode behavior, bounded effects, local API protections, read-only socket roles, credential save/restore and refresh races, stable source links across real process restart, explicit source revocation, CLI selection, and Relay consent/normalization/routing. Twitch service behavior and Codex account generation are separate real checks, not mocked-test claims.

## Real Twitch observations

- The broadcaster `techtushstreams` connected through OAuth and EventSub; the channel category and chat state were read through the integration.
- Earlier broadcaster tests exercised hearts, a free application poll, game contribution, mood suggestion, kindness approval, and a Twitch API recap response.
- The separate `popforgeontwitch` account subsequently supplied real `!shield` and `!heart` messages. The most recent `!heart` updated the community total; the OBS lounge showed three hearts.
- The transient heart burst ended before observation. It was **not** replayed or claimed as captured.
- A real companion restart restored the broadcaster’s remembered authorization and resumed EventSub listening.

These observations prove specific chat/integration behavior. They do not establish concurrent Twitch viewer counts, viewer retention, audience growth, remote Relay, or a completed public broadcast.

## Genuine Codex runtime

Main **development** session: `01a18204-be62-77d1-b0ad-70175ae80ee7`.

A direct SDK request produced Purple Bloom Garden (runtime session `01a18c78-fd71-79c1-8298-2b5b49655a7b`). The complete local studio flow then produced **Purple Community Garden in 14.0 seconds**, showed a ready private preview, and published it (runtime session `01a18c7c-4f21-76f1-a43a-f29d7ddb22bd`). This timing is one observation, not a guarantee.

The installed CLI resolved the bundled CLI’s account-model compatibility failure. No configured model change was required. The runtime result is validated scene data within four trusted mechanics, not arbitrary generated code. Real generation, readiness, and publication passed; the final narrated demonstration of development and Twitch is still pending.

## Actual OBS recording

| Field | Observed value |
| --- | --- |
| Application | OBS Studio 33.0.0, Apple Silicon Mac |
| Visual browser canvas | 1920 × 1080 |
| Recorded output | **1280 × 720, 30 fps, H.264** |
| Duration | **35.43 seconds** |
| Audio | **48 kHz stereo AAC, non-silent** |
| Signal analysis | Mean **−47.9 dB**, peak **−33.9 dB**; quiet music |
| Visual inspection | Extracted frames at 5 and 25 seconds show garden and lounge scene change |
| Finalization | OBS reported successful file finalization |
| Safety/status of rehearsal | Twitch broadcasting off, microphone muted; recording subsequently stopped |

![Garden from actual OBS recording](../docs/assets/community-garden.png)

![Lounge from actual OBS recording](../docs/assets/cozy-lounge.png)

The source alpha issue discovered in OBS was fixed by using the trusted renderer directly on the broadcast canvas; private previews retain their sandboxed iframe. The OBS custom dock, separate audio routing, and mixer signal were exercised.

Audio measurement confirms a signal, not perceptual quality. Final listening balance against narration is still required. No new chat command was captured during this 35-second recording. The MOV and remuxed MP4 are local rehearsal assets; they are not a finished or publicly uploaded submission video. Screenshots above are real extracted frames, not mockups.

## Evidence still absent

- Final under-three-minute YouTube demonstration showing real Twitch interaction and Codex development.
- Judge access to this private repository and confirmed submitted Devpost entry.
- Independent creator setup/adoption pilots, measured retention or growth, production transport/capacity testing.
- Real two-broadcaster Relay with simultaneous chats; secure remote Relay hosting.
- Live validation on operating systems other than the tested Mac.

The first two are submission work. The remaining items constrain claims and roadmap decisions; they are not required additions to the current local product before a truthful hackathon submission.
