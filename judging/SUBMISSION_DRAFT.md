# PopForge

## Elevator pitch

PopForge helps Twitch creators turn a short break into a shared community moment. Viewers participate directly in Twitch chat, grow a lasting garden, and catch up through a recap of recorded events.

## Inspiration

A creator should be able to take a breather without having to invent more entertainment. A newcomer should understand how to participate immediately. PopForge connects short community games, gentle reactions, and a little shared memory through simple live controls.

## What it does today

The local companion connects a broadcaster through Twitch OAuth and receives EventSub chat. Viewers contribute with free commands such as !water, !shield, !heart, and !recap. Three quick-start moments use a garden, moon defense, or focus timer; ten presets share four trusted mechanics. Streamers preview and approve changes before publication to the browser source.

Every five accepted live garden contributions grows a flower. The contribution completing the set can choose mint, moon, or sunset with !plant. The latest 24 flowers and live contribution total persist across companion restarts and fresh stream sessions. Rehearsal events have a separate garden. Focus timers record task completion only after the streamer explicitly confirms it.

A compact browser dock puts live controls beside OBS. The visual source URL survives companion restarts. Local host credentials are encrypted, with explicit disconnect removing remembered authorization. Reduced motion, quiet mode, moderated kindness notes, original synthesized music, and opt-in preview cursor glow support comfortable use.

## How we used Codex

PopForge was built end to end with Codex under human product direction: frontend and backend implementation, Twitch integration, original procedural visuals/music tooling, tests, debugging, visual iteration, and documentation. Third-party libraries retain their original authorship and licenses. PopForge also uses the official Codex SDK at runtime to generate a bounded scene specification, validated against a schema and rendered by trusted Canvas code. Private previews use a sandboxed iframe; the OBS source uses a direct canvas for CEF transparency compatibility. It does not execute arbitrary generated widgets.

The full local runtime flow was exercised: a Codex request generated Purple Community Garden in 14.0 seconds, the private renderer became ready, and publication updated the studio stage. Runtime session: 01a18c7c-4f21-76f1-a43a-f29d7ddb22bd.

Development session ID: 01a18204-be62-77d1-b0ad-70175ae80ee7. Confirm this is the intended submission thread before entering the form.

## Implementation

React, TypeScript, Vite, Express, Socket.io, Twurple OAuth/EventSub, Zod validation, original Canvas artwork, and the Codex SDK. Streamer control and read-only source connections have separate permissions. Credentials and runtime state are excluded from source exports.

## Evidence and practical limits

41 automated tests pass. Real Twitch chat was previously exercised with the broadcaster and a second chatter account. Runtime Codex generation, renderer readiness, and local publication have been exercised. Real Twitch authorization restored after restart. A separate account’s !heart reached EventSub and OBS displayed the updated heart total. A 35.43-second OBS rehearsal captures the garden-to-lounge change at 720p30 with non-silent stereo AAC audio. The music signal is quiet and final listening balance remains to be checked. The transient heart animation was not captured; no chat event was replayed. Twitch broadcasting stayed off.

The hosted owner-private Site is a static browser preview; the complete Twitch experience runs through the local companion. Relay is a same-computer two-creator prototype and has not been verified live with two broadcasters. No public viewer service, released Twitch Extension, measured retention improvement, or independent creator pilot is claimed.

## Judge setup

Source: https://github.com/TusharTechs/popforge (private; provide the organizers the required repository access before submission).

Requires Node.js 22+. Follow README.md to install, configure the local Twitch application, and run. Recipe mode can be evaluated without AI credentials. Runtime Codex generation requires an authenticated Codex CLI and uses the evaluator’s configured account allowance. Arrange a suitable free evaluation path with organizers; do not imply that a private Site or an inaccessible repository alone provides access.

Run npm test, npm run build, and npm run verify:local for automated checks and a secret-free connection report. Use judging/DEMO_AND_PILOTS.md for the real Twitch/OBS recording sequence.

Public YouTube video URL: PENDING — record and upload the real demonstration before submitting.

## Next steps

Independent creator pilots, a secure public service with per-channel isolation, remote collaboration, and richer community creations. These are future milestones.

## Submission readiness

See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for the complete outstanding requirements and required owner form answers. The repository remains private by the owner’s choice; the owner will arrange judge access. A PopForge project was not found in the connected Devpost account during the final review, and no submission is claimed. Public video, access, owner declarations, and final Submitted status still need completion.
