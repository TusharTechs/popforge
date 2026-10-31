# Run and evaluate PopForge

[README](../README.md) · [Architecture](ARCHITECTURE.md) · [Evidence](../judging/EVIDENCE.md)

## 1. Credential-free local evaluation

Use Node.js 22+ and npm. Clone the repository with an account that has access, then:

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:4317. Choose a quick-start garden, select Gentle, and start. Open http://localhost:4317/?lab=1 for labeled synthetic rehearsal controls; send `!water` five times with at least three seconds between contributions. Demo state and real Twitch garden state are separate. Do not interpret rehearsal participants as actual Twitch viewers.

No AI key, Twitch account, payment, or PopForge viewer signup is needed for this local evaluation. The public hosted browser preview also lets visitors start a moment and try a labeled sample contribution; it changes only that browser’s rehearsal garden. Select **Recipe remix** for deterministic scene creation. The hosted preview uses a separate browser-only transport; it is not the live companion backend.

## 2. Connect Twitch

In the [Twitch Developer Console](https://dev.twitch.tv/console/apps), register a **Confidential** application; **Broadcaster Suite** best describes this project. Add the exact tested local callback:

```text
http://localhost:4317/auth/twitch/callback
```

Twitch’s [authorization-code documentation](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow) includes localhost HTTP callbacks. If the console reports an HTTPS validation error, confirm that the entry is exactly `localhost` with the correct path and remove unused blank/other invalid entries. Do not simply change this to HTTPS: the companion does not serve TLS. A remote deployment needs a separate HTTPS/auth design.

Edit only the local `.env`:

```dotenv
PORT=4317
APP_ORIGIN=http://localhost:4317
TWITCH_CLIENT_ID=your_application_client_id
TWITCH_CLIENT_SECRET=your_application_client_secret
TWITCH_REDIRECT_URI=http://localhost:4317/auth/twitch/callback
ENABLE_CODEX=false
```

Restart the companion. Open **Connections → Connect Twitch**, sign in as the broadcaster, and approve `user:read:chat` and `user:write:chat`. The same Twitch account provides the EventSub chat subscription and sends `!recap` replies. Never commit `.env`, put secrets in frontend variables, or show credentials/source-token URLs in recordings.

Use another Twitch account/profile to send `!heart` in the broadcaster’s real chat. Check the companion reports chat listening and a real received message. Start a garden and send `!water` after the cooldown. Synthetic message submission is disabled while the live Twitch connection is active.

Host authorization and refreshed credentials are remembered in local encrypted identity files. Restart restoration was exercised with the real broadcaster. A temporary restore error offers retry; revoked authorization or a changed application can require new consent. **Disconnect** removes saved host credentials locally; revoke the grant in Twitch account settings separately if desired.

## 3. Add OBS video, audio, and controls

**Recommended:** open Connections → Setup assistant → Download OBS starter. In OBS’s macOS menu bar select **Scene Collection → Import**, choose `PopForge-starter.obs.json`, then select **PopForge starter** in Scene Collection. This creates separate **PopForge picture** and **PopForge sound** sources, with sound positioned outside the video canvas. It does not add microphone capture, change the output profile, add the control dock, or begin streaming. Keep this downloaded JSON private: it includes read-only source capabilities. Use the collection from the same companion origin you intend to run. A collection downloaded from a test port continues to point to that test port.

The import was exercised with OBS 33.0.0 on the tested Mac; the rendered scene and both source connections were observed. Audio still requires the explicit gesture below. Manual setup remains available:

Install [OBS Studio](https://obsproject.com/) for your platform. macOS Apple Silicon with OBS 33.0.0 is the actual tested combination.

1. In PopForge choose **OBS source** and copy the visual URL. Add an OBS **Browser** source at **1920 × 1080**, paste the URL, and keep the companion running. The source is transparent unless the creator enables a lounge background.
2. For sound, add a second Browser source using **OBS sound source**. Enable **Control audio via OBS**. Move this source outside the video canvas (the tested position is X=2000, Y=0 on a 1920-wide canvas).
3. Open that audio source’s **Interact** window and press **Enable sound**, or select/start an original track there. Browser playback needs a user gesture. Choose one playback surface to avoid doubled sound. Check the OBS mixer, then listen to a short local recording before broadcasting.
4. Open OBS **Docks → Custom Browser Docks** and add `http://localhost:4317/dock` as **PopForge controls**. This is a local control page; do not use it as a shared read-only source.
5. Optionally enable **Use as OBS background** in Cozy lounge. An environment preview alone does not change the stream.

Source URLs survive companion restarts. **Replace source links** intentionally invalidates old URLs, so update every affected OBS source after rotation. An open preview tab counts as a connected visual source; it does not prove OBS capture or broadcasting. The browser-only hosted preview cannot synchronize with OBS’s separate profile.

The current OBS profile recorded 1280 × 720 at 30 fps despite a 1920 × 1080 source canvas. If you want 1080p output, explicitly choose that in OBS Video/Output settings and verify a new recording. PopForge does not start Twitch broadcasting.

## 4. Optional genuine runtime Codex generation

Use an authenticated Codex CLI supported by your account, then set:

```dotenv
ENABLE_CODEX=true
# Optional: otherwise use the account default.
CODEX_MODEL=
# Optional: an absolute executable path; otherwise search PATH, then SDK bundle.
CODEX_CLI_PATH=
```

Restart and choose **Codex SDK** in Scene workshop. An actual request generates schema-bounded scene data, not arbitrary executable widgets. Inspect the private preview and Publish after it reports ready. The response includes a runtime thread ID.

Generation may consume the evaluator’s account allowance. If the bundled CLI rejects an account-configured model, use a compatible installed Codex CLI or explicit executable override; do not claim a recipe result is an AI result. One successful run used installed CLI 0.165.0-alpha.1.2 with SDK 0.149.1 and unchanged model selection. Availability and latency depend on the account/environment.

Recipe mode remains available without AI credentials. For judging runtime generation itself, arrange a free organizer-approved evaluation/demo path; never share the owner’s credentials in source or messages.

## 5. Verify and build

```sh
npm test
npm run build
npm start
```

With the companion running in another terminal:

```sh
npm run verify:local
```

This diagnostic reports service, Twitch configuration/authorization/listening, source presence, and generation enabled state without exposing tokens. It does not send chat, request generation, measure viewers, or prove OBS capture. It currently targets the default port 4317.

A clean source archive was independently installed, built, and tested without `.env` or `.data` on 30 October 2026. Automated tests use isolated state directories and local test ports 14317/14318; they do not contact Twitch or spend Codex allowance.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Nothing at port 4317 | Start `npm run dev`; inspect terminal; stop a conflicting process or configure matching PORT and APP_ORIGIN |
| OAuth redirect mismatch | Console callback and TWITCH_REDIRECT_URI must match exactly, including protocol, host, port, and path |
| Connected but no chat | Wait for subscription listening; check scopes/errors; retry or reconnect; verify the sender used the broadcaster’s channel |
| Repeated contribution ignored | An active round is required; respect the per-account cooldown and deadline |
| Garden appears unchanged in rehearsal | Live garden and demo garden are intentionally separate |
| OBS white background | Use the current `/overlay` source; this version uses direct trusted Canvas for CEF transparency |
| OBS has no sound | Interact with the sound source, start playback, route audio via OBS, check mute/levels, avoid quiet mode |
| OBS overlay does not follow hosted demo | Run the local companion; hosted demo synchronization only spans same-profile browser tabs |
| Source expired | Copy the current read-only URL after explicit source-link replacement |
| Codex fails | Check enabled flag, CLI authentication/executable, account model support, and visible error; recipe mode is separate |
| Relay guest cannot open invitation remotely | Current Relay is a same-computer prototype; localhost is not a public invitation endpoint |

Keep `.data` and `.env` private. The identity key and ciphertext together grant access to remembered host credentials. See [privacy and implementation boundaries](ARCHITECTURE.md#local-request-boundary).

## Guided rehearsal and transport checks

Open `/pilot` on the studio or hosted preview. Choose self-rehearsal, complete four observed tasks, record help/confusion honestly, and export the local JSON report. Reported completion is not automatically checked; task timing includes reading and idle time. No contact data or background telemetry is collected. An independent pilot requires an actual independent participant, not changing the report label.

For a reproducible isolated localhost transport rehearsal:

```sh
npm run rehearse:transport -- --events 500 --readers 20 --output /tmp/popforge-transport.json
```

The script starts its own temporary companion with Twitch and Codex disabled, sends synthetic demo actions, measures acknowledgments and reader convergence, then removes its state. It creates zero Twitch viewers. It does not measure Internet throughput or Twitch limits.
