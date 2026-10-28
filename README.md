# PopForge

**Your chat imagines it. Your stream plays it.**

A working first vertical slice of a Twitch community co-creation studio. A streamer describes a scene, previews a validated remix, publishes to a persistent OBS browser source, lets chat play a short cooperative game, and shares a catch-up card grounded in the actual event log.

## Run the complete local companion

Requires Node.js 22 or later.

```sh
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:4317**. No credentials are needed for recipe generation, demo chat, games, polls, scene previews, or recaps. The companion binds to `127.0.0.1`; it is a single-broadcaster local application, not a publicly exposed server.

For a production local build:

```sh
npm run build
npm start
```

`npm run dev:frontend` runs a separate frontend-only browser demo on port 4318. The hosted static version uses the same browser demo transport.

## Try the complete loop

1. Press **Forge a scene** in Live studio. Recipe remix supports a keyword, duration, accent, and gravity within four trusted mechanics.
2. Inspect the private sandbox preview. Adjust the scene name or parameters, then press **Publish to stream**. Publication requires a renderer readiness acknowledgment.
3. Press **Fill dead air**. A countdown starts. In Chat playground, send `!shield` (or `!water` for a garden). Change the demo chatter name to try a second participant. Each account has a three-second contribution cooldown.
4. Trigger the keyword button to heat the reactor, or send a message containing its keyword. At 100%, the meteor animation activates.
5. **Open vote** and use `!vote 1`, `!vote 2`, or `!vote 3`. One account has one vote and can change it. Votes close after 45 seconds. Ties use the first listed option; no votes means no winner. **Use twist** puts the winning idea in the composer for streamer approval.
6. Send `!forge make the meteors low gravity` to create a pending community proposal. It cannot publish itself.
7. Complete the goal or finish the round. Open **Stream lore** to see the recorded outcome. Save a manual moment to explain a joke, then preview the catch-up card.
8. Copy the **OBS source** URL and open it in another browser. With the companion running, both views receive the same authoritative state.

## Cozy Lounge and creator comfort

Open **Cozy lounge** in the sidebar, or `/?view=lounge`.

- **Four live environments:** Starlit hideaway, Rainy window, Aurora drift, and Golden-hour arcade. Each is original Canvas2D artwork with bounded community lanterns and constellations. Choose **Use as OBS background** to put the environment in the overlay; previews alone do not change the broadcast.
- **Original procedural audio:** press **Enable sound** for a generative synth/key soundscape, then mix music, filtered rain, night air, and overall volume. Optional reaction chimes start disabled. No audio downloads or external music service are used. Music never starts automatically. Browser playback and account-free demo mode are supported; actual OBS audio routing needs a live OBS check.
- **Reactions:** `!heart` / `!hug`, `!glow`, `!star`, and `!hype` add hearts, lanterns, constellation stars, and celebration bursts. Encouragement uses a four-second per-account cooldown and visual bursts are capped at four per second. Every twelve hearts fills a persistent kindness jar. Click the lounge sky in demo mode to submit a labeled demo lantern; read-only viewers cannot mutate shared state.
- **Community mood suggestions:** `!vibe starlight`, `!vibe rain`, `!vibe aurora`, or `!vibe sunset`. One suggestion per account, with changes allowed. Only the streamer applies the winning atmosphere. Server restarts reopen suggestions with a fresh ledger/count.
- **Moderated kindness wall:** `!kind your message` enters a bounded approval queue. The streamer approves or dismisses it. Only approved notes appear in the room and recap; removing a note withdraws its matching lore entry too. Viewer snapshots omit the moderation queue. Recent public chat may still contain the original public Twitch command.
- **Creator corner:** choose a one-, two-, or five-minute breather and a custom community message. An active round pauses; **I’m back** resumes it only if the breather was what paused it. Timer expiry becomes “No rush” and never auto-resumes a broadcast. A manually paused round remains paused.
- **Gentle break nudges:** explicitly opt in and select 30, 45, 60, or 90 minutes. These are app-local, browser-private preferences displayed in the creator corner and as a discreet studio banner when due, not OS notifications or a stress detector. Snooze a due nudge for ten minutes. Studio session time is not a claim about actual Twitch broadcast duration.
- **Comfort controls:** Gentle, Balanced, Party, or Quiet energy; adjustable sparkle intensity; separate particle and reduced-motion settings. Quiet pauses local audio and celebration bursts, while contributions still accumulate. Reduced motion stops scene motion and shows only a minimal static reaction.

For sound in OBS, add a second Browser Source using the **OBS sound source** link (`/sound?token=…`), use **Interact**, and press **Enable sound** once. Route that source through OBS audio controls. Use one audio playback surface to avoid doubling the sound. The sound URL is read-only and expires with the companion session like the visual source URL.

Nightshift from Meterless was reviewed as an optional future asset-generation pipeline. This build does not install, call, or depend on Nightshift, and no generated or licensed third-party tracks are bundled. See [Meterless’s engine overview](https://meterless.ai/engines.html).

## Twitch integration

Create a confidential application in the [Twitch developer console](https://dev.twitch.tv/console/apps). Register this exact OAuth redirect:

```text
http://localhost:4317/auth/twitch/callback
```

Set `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env`, restart the companion, and use **Connections → Connect Twitch**. Do not place secrets in a frontend environment variable. The flow requests `user:read:chat` and `user:write:chat`; it uses the broadcaster account for EventSub chat and `!recap` responses.

Twurple manages token refresh and EventSub WebSocket reconnection. The integration reads chat and channel category, processes the commands above, and responds to `!recap` with a short event-grounded summary (channel-wide 30-second reply cooldown). OAuth state is expiring, one-use, and tied to the initiating local session. Tokens live in server memory and are discarded on restart/disconnect. Reconnect after a server restart.

Demo message submission is disabled while Twitch is connected. The dashboard displays connection/subscription errors. **Real Twitch OAuth and EventSub delivery still need an account-authorized live test.** Category metadata is not gameplay-state detection.

## OBS

Choose **OBS source**, copy the read-only URL, and add a Browser Source at **1920 × 1080**. The route has a transparent background. Keep the companion running and the source loaded. Each companion restart creates a new read-only URL; copy it again. Preferences includes a compact overlay mode.

The OBS URL can read scene state but cannot submit studio commands, even if the browser has a studio cookie. Do not share it outside your broadcast tooling: it grants read access to this session's public chat and event log. The local recap URL is also read-only and intended for local/testing use. A local `localhost` link cannot serve remote viewers; a public viewer service/Extension remains a later deployment step. Twitch chat's `!recap` works for remote viewers once connected.

The hosted frontend demo syncs via localStorage and BroadcastChannel between tabs **in the same browser profile**. OBS has its own browser profile, so real OBS synchronization requires the companion. The source dialog explains this limitation.

## Optional Codex SDK generation

Authenticate your Codex CLI, set `ENABLE_CODEX=true` in `.env`, and restart. Choose **Codex SDK** in the composer. Leave `CODEX_MODEL` empty to use the configured account default or explicitly set one available to your account. Generation can consume your account allowance.

The server runs the genuine `@openai/codex-sdk` with JSON-schema structured output, an isolated working directory, read-only sandbox, no web search, and a 90-second timeout. The subprocess does not inherit Twitch client secrets. Valid output is parsed again with Zod. Generation errors stay errors; they do not silently become a fake AI result. A configured request returns its thread ID for development evidence. **The SDK path has been type-checked but not exercised against a paid/authenticated account in this build.**

The first version generates **scene data**, not arbitrary executable overlays. The four supported mechanics are keyword reactor, cooperative meteor defense, cooperative garden, and focus countdown. Recipe mode deterministically matches supported parameters; it does not claim to understand every prompt. Unsupported concepts require a new trusted mechanic. Open-ended code generation and a code execution service are future work.

## Architecture

- `shared/engine.ts`: schema, bounded scene recipes, authoritative commands, vote deduplication, contribution cooldowns, timed rounds, scene history, and grounded recap selection.
- `server/index.ts`: Express/Vite host, protected studio session, Socket.io state transport, read-only source authentication, state persistence.
- `server/twitch.ts`: OAuth-backed Twurple EventSub integration and chat recap responses.
- `server/generator.ts`: optional Codex SDK structured scene generation; credential-free recipe fallback selected explicitly by the user.
- `src/client.ts`: server transport and browser-only demo transport.
- `src/renderer.ts`: trusted Canvas2D simulation with simple gravity and circle collision response; no external assets or network access.
- `src/SceneFrame.tsx`: sandboxed renderer and readiness bridge.
- `shared/lounge.ts`: validated atmosphere, comfort, break, effects, and kindness schemas.
- `src/Lounge.tsx`: environments, creator corner, kindness wall, community suggestions, and ambient overlay HUD.
- `src/audio.ts` / `src/AudioDock.tsx`: opt-in procedural Web Audio engine and mixer, with an OBS sound route.
- `src/App.tsx`: studio, library, chronicle, connections, preferences, OBS source, and viewer recap routes.

The renderer runs in a sandboxed `srcdoc` iframe with scripts allowed, no same-origin privileges, and a restrictive CSP. No credentials are sent into it. No generated strings are interpolated into its executable source. The trusted renderer consumes bounded data using postMessage; the host verifies readiness by the frame's source window. Previewing a candidate leaves the published scene running. Publishing updates the existing stage without reloading the OBS route; the last three scene definitions remain available for rollback. This is a trusted-scene runtime, not a general-purpose untrusted JavaScript sandbox.

Physics is visual; the authoritative game result depends on chat contributions and the deadline. There are no financial stakes. Streamer approval and server-originated events are the authority. Fullscreen Extensions, Bits, Channel Points, native Predictions, automated game verification, and rolling stream transcription are not implemented. Browser speech recognition is an optional keyword-only input; audio is processed by the browser's speech service after its permission prompt. It does not create a transcript or lore summary.

## State and privacy

The local companion writes an atomic snapshot to ignored `.data/state.json`; browser demo data remains in localStorage. Both include recent public chat (50 messages), events (80), and pending proposals (10). No OAuth credentials are persisted. Reset session clears the workspace state. Private deduplication/vote/cooldown ledgers are in memory; see `KNOWN_LIMITATIONS.md` for restart behavior. The app does not detect passive viewer joins or identify lurkers.

## Verification

```sh
npm test
npm run build
```

Tests cover voting semantics and deadlines, event deduplication, cooldowns, pause/resume, win/loss outcomes, schema bounds, rollback, grounded lore, request/session protection, read-only authorization even with shared cookies, and state synchronization to viewer sockets. Browser QA covers generation/preview/publication, demo commands, voting, navigation, ambient sound start/stop, quiet mode, lantern contributions, kindness approval, and the breather UI. Live Twitch, Codex generation, and OBS Studio itself require configured accounts/app access and are not claimed as verified.

## References

- [Twitch EventSub WebSockets](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/)
- [Twurple listener setup](https://twurple.js.org/docs/getting-data/eventsub/listener-setup.html)
- [Codex SDK](https://developers.openai.com/codex/sdk/)
- [Twitch Extension policies](https://dev.twitch.tv/docs/extensions/guidelines-and-policies/)

Built for the Codex × TwitchCon Hackathon. PopForge is an independent project, not an official Twitch or OpenAI product.
