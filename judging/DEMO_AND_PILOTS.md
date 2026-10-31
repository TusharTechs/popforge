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

Before submission, provide the required repository URL and access, Codex session ID, public YouTube demonstration, and tested run instructions. The public static Site alone is not judge access to the complete local companion.

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

## Codex CLI compatibility verification

The SDK’s bundled CLI (0.149.1) rejected the configured model. Using the installed Codex CLI (0.165.0-alpha.1.2) succeeded with the existing ChatGPT login and unchanged model selection. PopForge now prefers an executable on PATH, supports an explicit CODEX_CLI_PATH override, and falls back to the SDK bundle if neither is available. Generation returned a validated Purple Bloom Garden specification and session 01a18c78-fd71-79c1-8298-2b5b49655a7b. This supersedes earlier notes describing all runtime generation as unverified or blocked. The complete submitted demonstration remains a separate deliverable.

The full local app workflow was subsequently exercised: Codex generated Purple Community Garden in 14.0 seconds, the private renderer reported ready, and Publish updated the studio stage. Session: 01a18c7c-4f21-76f1-a43a-f29d7ddb22bd. Screenshot evidence is saved outside the source checkout. This verifies local generation, preview, and publication; Twitch and OBS capture were not part of this run.

## Real OBS setup verification

OBS Studio 33.0.0 was installed on the Apple Silicon Mac through Homebrew’s OBS cask. Browser visual source is 1920 × 1080. A separate audio browser source is routed through OBS and placed at X=2000 outside the canvas. Its soundscape was explicitly enabled in OBS Interact; the OBS mixer displayed a nonzero signal. Microphone is muted. PopForge controls were added through Custom Browser Docks and displayed the connected broadcaster.

The broadcaster techtushstreams restored automatically and resumed listening after a real companion restart. The initial OBS overlay exposed a white iframe background; the broadcast route now uses the same trusted renderer directly on a canvas, while private scene previews retain their sandboxed iframe. The white background disappeared in the OBS preview. A second account subsequently sent !heart; EventSub received it and the OBS lounge showed the updated total of three hearts. The transient burst was not captured or replayed. No stream or recording was started during initial setup.

## Recorded rehearsal — 30 October 2026

OBS saved a 35.43-second local rehearsal, H.264 1280 × 720 at 30 fps with 48 kHz stereo AAC. Visually inspected frames at 5 and 25 seconds show Purple Community Garden and the lounge scene change. The 1920 × 1080 browser canvas is downscaled by the current OBS output settings.

Audio analysis: mean −47.9 dB, peak −33.9 dB. This verifies a non-silent signal, not perceptual listening quality; check the quiet music against narration before final submission. OBS finalized the file successfully. Broadcasting remained off, microphone was muted, and no new Twitch command was captured in this rehearsal.

Evidence assets are kept outside the source checkout: popforge-obs-rehearsal.mp4, popforge-recording-verification.json, popforge-recording-frame-start.png, and popforge-recording-frame-lounge.png. The MP4 is remuxed without re-encoding from the original OBS MOV. These are local evidence assets, not a public YouTube submission. Record the remaining real garden contributions, recap, Codex development segment, and narration before assembling the final under-three-minute video.

## New signature loop and own rehearsal

Use the four tasks at `/pilot` for the owner’s rehearsal first. Record outcomes and help needed honestly; the JSON is an observer report, not automatic success verification. Do not relabel a self-rehearsal as independent evidence.

For the final demo, compress the garden segment to show five accepted real contributions earning a seed, a real second account sending `!grow pond` in an open choice, creator approval, the resulting place in OBS, and recap context. This should replace generic feature-tour footage, keeping the finished video under three minutes. The new world command has automated and browser coverage but still needs this real Twitch/OBS capture.

The downloadable starter was imported successfully by the owner into OBS 33.0.0; separate picture and sound sources connected to the isolated test companion. That import did not start broadcasting or recording and did not verify a new sound-playback gesture. Download a collection from the intended live companion before final recording; test-port source URLs keep pointing to the test port.
