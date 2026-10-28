# First-build boundaries

- This is a single-broadcaster local companion plus a static hosted browser demo, not a multi-tenant hosted Twitch service. No five-million-viewer capacity claim is made.
- Four trusted mechanics can be remixed; the app does not generate arbitrary executable widgets. The Codex path outputs a validated scene specification.
- Twitch integration was live-tested on the configured broadcaster account; a second independent Twitch account has not been used. Codex generation still needs its own configured account test. Connections are not inferred from the UI demo.
- The private hosted demo is for owner review. Browser demo state syncs only within the same browser profile. Use the companion for cross-browser/OBS synchronization.
- The local recap page cannot be reached remotely by stream viewers. The broadcaster's authenticated `!recap` response is the first remote viewer channel. A public companion or reviewed Twitch Extension needs a later hosting/auth design.
- Event history is capped at 80 and chat at 50 messages. A recap includes up to three recorded events from the chosen time window; it is not a full stream transcript or AI inference about gameplay.
- Voice is optional browser speech recognition for a keyword. Availability varies by browser; its service may process audio remotely. It is never enabled automatically.
- No Bits wagering, point payouts, automated audiovisual bounty settlement, or public Twitch Extension is included.
- Round and poll snapshots persist, but in-memory anti-duplication ledgers do not survive a companion restart. The companion returns restored active rounds to standby and closes restored open polls to prevent continuing with incomplete ledgers. In a browser-only demo, reloading also returns a fresh local ledger; an open round continues from its persisted progress. This demo does not provide adversarial vote integrity.
- Simple particle physics illustrates the scene. Chat actions and time determine the outcome, not vision detection or particle hits.
- Feature icons use Lucide; scene illustrations are original code-generated canvas/CSS artwork. Google Fonts is optional; system fonts remain usable offline.
- Do not expose the local Node service to the public Internet without adding durable broadcaster identity, tenant isolation, HTTPS, persisted encrypted token storage, and public viewer transport.

## Cozy Lounge notes

- The music is an original procedural browser synthesizer with filtered noise, not generated audio files or a commercial music library. Playback depends on Web Audio and user activation. We verified the browser playback controls; OBS mixing and audible capture require a live OBS test.
- Ambient effects are bounded representations of contributions, not one physics entity per viewer. Fullscreen lounge backgrounds are optional and the streamer decides when they replace the gameplay scene.
- Break nudges are private browser-local UI reminders available while the dashboard is open. They do not infer stress, measure health, or promise to treat burnout.
- Server restart restores an active breather as an open-ended pause, clears transient effects, and resets mood suggestion counts because identity ledgers are not persisted. Approved notes and community totals persist.
- Nightshift was researched but is not integrated. No third-party service installation or payment is required for the comfort features.
