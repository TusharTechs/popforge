# First-build boundaries

- This is a single-broadcaster local companion plus a static hosted browser demo, not a multi-tenant hosted Twitch service. No five-million-viewer capacity claim is made.
- Ten scene presets share four trusted mechanics; the app does not generate arbitrary executable widgets. The Codex path outputs a validated scene specification.
- Twitch integration was live-tested on the configured broadcaster account; a second account has verified shield and heart commands, while two-broadcaster Relay remains unverified live. Codex generation still needs its own configured account test. Connections are not inferred from the UI demo.
- The private hosted demo is for owner review. Browser demo state syncs only within the same browser profile. Use the companion for cross-browser/OBS synchronization.
- The local recap page cannot be reached remotely by stream viewers. The broadcaster's authenticated `!recap` response is the first remote viewer channel. A public companion or reviewed Twitch Extension needs a later hosting/auth design.
- Event history is capped at 80 and chat at 50 messages. A recap includes up to three recorded events from the chosen time window; it is not a full stream transcript or AI inference about gameplay.
- Voice is optional browser speech recognition for a keyword. Availability varies by browser; its service may process audio remotely. It is never enabled automatically.
- No Bits wagering, point payouts, automated audiovisual bounty settlement, or public Twitch Extension is included.
- Round and poll snapshots persist, but in-memory anti-duplication ledgers do not survive a companion restart. The companion returns restored active rounds to standby and closes restored open polls to prevent continuing with incomplete ledgers. In a browser-only demo, reloading also returns a fresh local ledger; an open round continues from its persisted progress. This demo does not provide adversarial vote integrity.
- Simple particle physics illustrates the scene. Chat actions and time determine the outcome, not vision detection or particle hits.
- Feature icons use Lucide; scene illustrations are original code-generated canvas/CSS artwork. Google Fonts is optional; system fonts remain usable offline.
- Do not expose the local Node service to the public Internet without adding durable broadcaster identity, tenant isolation, HTTPS, production secret management, and public viewer transport. Local encrypted credential persistence does not turn this into a multi-tenant service.

## Cozy Lounge notes

- Music includes a procedural browser synthesizer plus three original synthesized WAV loops; no commercial recordings are bundled. Playback depends on Web Audio and user activation. We verified the browser playback controls; OBS mixing and audible capture require a live OBS test.
- Ambient effects are bounded representations of contributions, not one physics entity per viewer. Fullscreen lounge backgrounds are optional and the streamer decides when they replace the gameplay scene.
- Break nudges are private browser-local UI reminders available while the dashboard is open. They do not infer stress, measure health, or promise to treat burnout.
- Server restart restores an active breather as an open-ended pause, clears transient effects, and resets mood suggestion counts because identity ledgers are not persisted. Approved notes and community totals persist.
- Nightshift was researched but is not integrated. No third-party service installation or payment is required for the comfort features.

## Creator Relay

- Relay is a two-creator, same-computer prototype. Invitation links are localhost-only and cannot reach remote collaborators; a secure hosted multi-tenant service would be required. Guest accounts must explicitly authorize their own Twitch credentials. No directory or automated matching exists.
- Real two-broadcaster Relay OAuth and simultaneous Twitch chat have not yet been verified end to end. Relay pauses if either chat connection drops. Memory-only approvals and vote ledgers reset on process restart; reconnect and create a fresh invitation.
- A raid handoff presents the native command for the host to execute; it does not start or verify a Twitch raid, and the Relay overlay is a separate OBS source.
- Load rehearsals run only against the in-browser engine. They do not simulate network transport, Twitch limits, concurrent devices, or actual viewer growth.
- Up to 100,000 votes and 200,000 event IDs are accepted per episode. Excess events are rejected rather than risking duplicate votes. A tied or empty decision has no automatic winner.

## Returning to the studio

- The host Twitch authorization now persists locally in encrypted, owner-only identity files. The key is stored alongside it in a separate owner-only file; this is not an OS keychain and does not protect against someone who controls the same OS account. Startup and refresh persistence are covered with a mocked Twitch runtime; the real Twitch restart flow still needs the next broadcaster sign-in.
- Disconnect forgets saved host credentials locally. Revoking consent in Twitch itself remains a separate user action. Token invalidation or changes to the configured application can require consent again.
- Source URLs now survive restarts. Links from an older memory-only version must be replaced once. Replacing source links intentionally invalidates the old URLs and disconnects existing reader sockets.
- A visual source reported as connected can be a preview browser tab. OBS capture, broadcast visibility, and audible routing still need checking inside OBS.
- Compact controls are a local `/dock` page intended for an OBS Custom Browser Dock. Actual OBS installation and dock testing remain outstanding; browser controls have been exercised.
- Gentle moments lower the goal to five contributions; they do not infer audience size, adapt difficulty automatically, or identify silent viewers.
- The onboarding and live-control work does not include a public SaaS backend, a persistent community-world mechanic, external creator pilots, moderator accounts, or remote Relay hosting.
