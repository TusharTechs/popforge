# PopForge final judging rehearsal

**30 October 2026. Simulated review by the implementation assistant, not an independent human panel or an official AI judge.** The human-style lens considers the experience and demo story; the AI-style lens asks how readily each claim can be verified from code and evidence. Approximate scores use the official maximum of **5 per criterion**. All four criteria are equally weighted; no formal tracks were returned by the official judging-criteria tool.

[Official criteria and rules](https://twitchcon-codex.devpost.com/rules) · [Evidence](EVIDENCE.md) · [Outstanding submission requirements](SUBMISSION_CHECKLIST.md)

## Assessment

| Criterion | Human-style / 5 | AI evidence lens / 5 | Reasoning |
| --- | --- | --- | --- |
| Innovation/Idea | **3.5** | **3.5** | Streamer-approved scene creation, a lasting chat garden, catch-up context, and a cozy break workflow form a coherent combination. Chat games, overlays, recap tools, and co-creation already exist as categories; the combination has to earn its distinction in the working demo. Runtime output is intentionally bounded to four mechanics. |
| Potential Impact | **4.0** | **3.5** | Staying in Twitch chat and using an OBS dock reduces context switching. A gentle moment can work for one chatter. Evidence proves participation, not retention, adoption, or creator growth. Manual developer-app setup remains friction for an ordinary creator. |
| Technological implementation | **4.0** | **4.0** | Strong local vertical slice: real OAuth/EventSub, authoritative state, genuine Codex SDK generation, schema validation, reader/control separation, persistence, restart checks, 51 tests, clean install, and actual OBS capture. Hosted backend/tenant isolation, remote Relay, wider platform tests, and real crowd transport tests remain absent. |
| Design | **4.0** | **3.5** | Cozy original art, no-viewer-signup commands, quick starts, compact controls, keyboard-operable dropdowns, reduced motion, and restrained optional effects are strengths. The number of secondary features can blur the first-use story. Final listening and an independent setup observation would strengthen the evidence. |
| **Total** | **15.5 / 20** | **14.5 / 20** | Approximately **3.9/5** and **3.6/5** overall. Estimates, not official predictions. |

## Where it stands

PopForge has moved beyond a visual concept into a demonstrated local Twitch/OBS product. It is technically credible for the hackathon theme and Codex requirement, subject to ordinary eligibility and organizer review. It is **not yet a complete submitted entry**: video, private repository access, Devpost project/status, owner declarations, and the free evaluation arrangement remain open. No assessment should imply those administrative requirements have already passed.

The strongest story is: **“A creator takes a breather; chat builds something that is still there when they return.”** Lead with one gentle garden, a real second-account command, the resulting OBS change, and the lasting flower. Then show Codex creating a themed variation, private approval, and a late-viewer recap. Show the comfort controls as the experience’s finish. Keep Relay and the creative kit as supporting depth rather than making the video a tour of every tab.

## Highest-value improvements before the demo

1. **Capture the complete real loop.** The existing rehearsal records a scene change, not a new live chat reaction. Record an actual second-account contribution reaching OBS, five accepted garden contributions, persistence, and a `!recap` reply. Do not replay an old event as live footage.
2. **Make Codex development visible.** Show a real development/session segment and one genuine runtime request. Explain that Codex built the product end to end under human direction; runtime scene generation is an additional implemented use. Keep account/secret information out of view.
3. **Make setup credible for a new creator.** Demonstrate the OBS dock and remembered authorization/source URLs. If a volunteer is available, observe first setup and note where help is needed. A new creator pilot is optional evidence, not a reason to invent adoption claims.
4. **Balance the final soundtrack by listening.** The current measured audio signal is quiet. Final narration should be clear and music pleasant in the actual exported video.
5. **Finish access and submission checks.** Private repo access, public/unlisted YouTube playback, actual Devpost Submitted status, and owner declarations have more immediate value than another feature.

No new feature is necessary to tell the current working story truthfully. The previous main-chunk warning has been resolved through application/vendor separation; startup speed remains unbenchmarked.

## After the hackathon

Independent creator pilots should measure first setup time, help needed, command comprehension, and voluntary reuse on a second broadcast. A hosted service would need per-channel identity/isolation, managed secrets, public viewer transport, deployment operations, and a reviewed remote collaboration flow. Evaluate demand before monetization. The initial business hypothesis is creator-paid convenience and richer original scene packs with free viewer participation; it is not an implemented billing system or proven business.

## Evidence boundaries

This review relies on inspected source, passing automated checks, earlier browser/native observations, real Twitch receipt records, genuine runtime generation, and actual recording frames/audio analysis. It does not claim an independent human usability study, listening-quality verification, a competing-project originality audit, or a forecast of finalist selection. The official rules allow several evaluation methods; these two lenses are preparation aids only.


## Follow-up: 31 October visual/access pass

The owner authorized making the browser preview public while retaining the private GitHub repository. This improves access to the rehearsal experience; it does not deploy the Twitch backend or remove real-creator developer-application setup.

The garden now presents a warm illustrated greenhouse, empty planting beds, clear contribution progress, and actual earned blooms. No decorative starter flower is counted as earned progress. The renderer selects the explicitly labeled rehearsal garden when appropriate, keeping live totals separate. Cosmic scenes now have distinct mission palettes/instructions and readable particle placement. Mobile stage captions sit below the artwork; the former white edge strips are addressed with full-canvas preview painting and iframe styling. Small-screen Live controls now retain the stage preview. A browser-only sample action makes the public preview interactive without developer-lab controls.

The earlier approximately 541 KB main bundle is split into roughly 177 KB application and 373 KB vendor chunks. The large-chunk warning is resolved; no startup timing improvement is claimed without measurement.

These changes strengthen design and evaluation access. The original score estimates remain a historical rehearsal, not an automatically earned higher result. Higher scores still depend on the following evidence and product decisions:

| Criterion | Strongest remaining gap | Concrete next improvement |
| --- | --- | --- |
| Innovation | A coherent combination of familiar mechanics needs a signature behavior that is difficult to substitute | Make collective choices change a persistent community world across broadcasts, then show that consequence and catch-up context working; remote, consent-based two-community collaboration is another future path |
| Potential Impact | Ordinary creators still need a local developer application; independent adoption is unmeasured | Observe 3–5 independent first setups and later voluntary reuse; design one Twitch sign-in plus guided OBS setup for a production service |
| Technical implementation | Hosted identity/tenant isolation, durable event ledgers, end-to-end load behavior, and remote Relay are not established | Add per-channel authorization/storage, durable deduplication/recovery, and instrumented transport tests before claiming a public multi-creator service or large audience capacity |
| Design | The owner’s preferences and assistant checks are not independent usability evidence | Watch a new creator complete setup, start/stop a moment, and understand an empty/no-chat state without coaching; complete accessibility and narration/music listening checks |

The next product investment should be setup and one distinctive community loop, with pilots guiding scope. Adding more generic presets alone is unlikely to establish stronger innovation. No numerical score increase or judging outcome is guaranteed by these changes.

## Follow-up: 31 October implementation against the remaining opportunities

The prior score table is historical. The following changes improve what can be demonstrated without claiming an independent panel reassessment:

| Criterion | New concrete evidence | Remaining ceiling |
| --- | --- | --- |
| Innovation | Earned seeds, one-account community building choices, creator approval, persistent visible places and recap context form a consequential loop across broadcasts | Three authored landmarks; no claim of first-ever novelty. Capture a real Twitch choice and resulting OBS place |
| Potential Impact | Downloadable OBS starter, remembered host authorization, guided connection steps, and an observer-report rehearsal reduce friction | Each creator still configures a developer app; no independent adoption, voluntary reuse, or retention evidence |
| Technical implementation | Atomic state/recovery checkpoints, bounded replay protection, corruption handling, process recovery tests, 51 total tests, and real localhost transport convergence | No public tenant-isolated backend, remote Relay, Internet capacity proof, or unlimited exactly-once delivery |
| Design | World-building card, clearer next action, setup assistant, separate OBS sources imported successfully, and guided self-rehearsal | Independent ease-of-use observation and final audio listening still needed |

Prioritize the real garden → vote → creator build → OBS → recap sequence for the video. Do not add another generic feature to substitute for this evidence. The owner chose self-rehearsal before external pilots; guided-report tooling is ready, but the assistant has not recorded a completed independent study or self-reported the owner’s subjective feedback. See [production gates](../docs/PRODUCTION_GATE.md) for the remaining hosted-product work.

## Viewer comprehension follow-up

A missing viewer-facing part of the signature loop was addressed: OBS now shows the available building commands, live counts and countdown. It explains pending creator approval, then reveals the approved place. Streamers can open, close, and approve from the compact dock. This strengthens the design criterion and makes the persistent-world idea easier to assess during an actual broadcast. The isolated rehearsal reached an earned seed, synthetic choice, and a build approved through the compact controls; the actual OBS reveal was visually inspected. Real Twitch evidence is tracked separately in the evidence ledger. No automatic score increase or independent usability result is asserted.

## Real evidence and contribution feedback follow-up

The owner rehearsal now closes the signature loop with real Twitch: five accepted contributions, earned seed, one real Reading nook vote, creator approval, OBS reveal, Twitch recap, and companion restart persistence. Watering and moon planting also produced visually inspected animated responses in actual OBS footage. The small-chat guide now offers varied, spaced commands. These changes strengthen demonstrable implementation and viewer comprehension; independent creator validation and the final Codex-plus-Twitch submission video remain open. The historical score table is not an official or independent reassessment.
