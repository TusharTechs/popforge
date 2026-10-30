# PopForge demonstration and creator pilot

## Three-minute demonstration

Record actual behavior; keep browser-only rehearsal clearly labeled. Never display .env, OAuth credentials, private source URLs, or authentication dialogs in the submitted video.

- 0:00–0:20: Explain the streamer’s break and the viewer’s wish to contribute. Show the Live controls screen.
- 0:20–0:45: Start a gentle garden. Show a separate account sending !water in Twitch and the resulting OBS update.
- 0:45–1:10: Five real contributions grow a lasting flower. Send !plant sunset as the fifth contribution. Show the garden returning after a fresh session.
- 1:10–1:35: Show !recap in Twitch. Explain that it reports recorded events and streamer notes.
- 1:35–2:10: Show Codex development evidence from this project’s real session. If runtime generation has been exercised successfully, show one request, private preview, and publication. Label recipe remixes accurately.
- 2:10–2:40: Show break/return and compact controls. Include actual OBS video and audio evidence if available.
- 2:40–2:55: State the current platform and limitations. End with the community garden and clear instructions for judges.

Before submission, provide the required repository URL and access, Codex session ID, public YouTube demonstration, and tested run instructions. The owner-private static Site alone is not judge access to the complete local companion.

## Live verification record

For each item record date, environment, result, evidence path, and any failure. Leave unperformed items pending.

- Broadcaster OAuth, separate chatter, EventSub commands.
- Real OBS visual capture and audio recording.
- Remembered host authorization after companion restart.
- Old OBS source reconnects after restart.
- Runtime Codex generation, validated result, preview, and publish.
- Two creator accounts and explicit Relay approval; identify that localhost invitations require the same computer.

## Independent creator pilot

Invite creators only with the owner’s explicit authorization. Aim initially for three to five independent creators; participation is voluntary.

Observe first setup without coaching: elapsed setup time, where help was needed, time to first real chat response, and whether the streamer can stop an activity. Ask viewers what command they believe they should use. Ask the streamer to choose whether to use it on a later broadcast.

Record observed results separately from impressions. Suggested fields: anonymous pilot ID, date, stream category, setup time, assistance needed, enabled feature, participant actions, setup failures, second-broadcast use, quote permission, and requested improvements. Do not equate chat participation with viewer retention or attribute growth causally to PopForge.

No pilots have been claimed by this document. No measured retention or growth claim should appear without evidence.

## Runtime generation attempt

The existing Codex CLI reported a ChatGPT login. A real SDK request was attempted. The service rejected the configured `gpt-6.1-sol` model with `model_not_found`, stating it is unsupported for Codex with this ChatGPT account. No successful runtime generation is claimed. Configure `CODEX_MODEL` with a model available to this account, then repeat generation, private preview, and publication before including that feature in the demo.

## Codex CLI compatibility verification

The SDK’s bundled CLI (0.149.1) rejected the configured model. Using the installed Codex CLI (0.165.0-alpha.1.2) succeeded with the existing ChatGPT login and unchanged model selection. PopForge now prefers an executable on PATH, supports an explicit CODEX_CLI_PATH override, and falls back to the SDK bundle if neither is available. Generation returned a validated Purple Bloom Garden specification and session 01a18c78-fd71-79c1-8298-2b5b49655a7b. This supersedes earlier notes describing all runtime generation as unverified or blocked. Actual OBS capture and a complete on-stream demonstration remain separate checks.

The full local app workflow was subsequently exercised: Codex generated Purple Community Garden in 14.0 seconds, the private renderer reported ready, and Publish updated the studio stage. Session: 01a18c7c-4f21-76f1-a43a-f29d7ddb22bd. Screenshot evidence is saved outside the source checkout. This verifies local generation, preview, and publication; Twitch and OBS capture were not part of this run.

## Real OBS setup verification

OBS Studio 33.0.0 was installed on the Apple Silicon Mac through Homebrew’s OBS cask. Browser visual source is 1920 × 1080. A separate audio browser source is routed through OBS and placed at X=2000 outside the canvas. Its soundscape was explicitly enabled in OBS Interact; the OBS mixer displayed a nonzero signal. Microphone is muted. PopForge controls were added through Custom Browser Docks and displayed the connected broadcaster.

The broadcaster techtushstreams restored automatically and resumed listening after a real companion restart. The initial OBS overlay exposed a white iframe background; the broadcast route now uses the same trusted renderer directly on a canvas, while private scene previews retain their sandboxed iframe. The white background disappeared in the OBS preview. Actual recorded audiovisual output and live chatter contributions during this OBS run remain pending. No stream or recording was started during setup.
