# How PopForge was built with Codex

PopForge was built in one main Codex Desktop thread, **`01a18204-be62-77d1-b0ad-70175ae80ee7`**, from 28 to 31 October 2026. The creator brought the goal, the product calls, the Twitch and OBS accounts, and live testing as both streamer and chatter. Codex designed and wrote the application, connected it to Twitch, tested it in a browser and against real chat, and wrote the documentation.

Codex is also part of the product: the studio can ask the **Codex SDK** to create a new scene while the stream is live (see [runtime generation](#codex-at-runtime)).

## The thread in numbers

Counted from the local session log for the main thread:

| | |
| --- | --- |
| Duration | 28 Oct 10:18 UTC → 31 Oct 08:36 UTC |
| Creator prompts | 42 (many are short: "ready", "sent", "continue", screenshots of what looked wrong) |
| Codex turns | 34 |
| Shell commands run by Codex | 420 (builds, tests, OAuth setup, OBS checks, Git) |
| JavaScript / in-app browser steps | 355 (mostly driving the studio pages to check its own work) |
| Parallel sub-agents | 4 |

## Timeline

| When (UTC) | What the creator asked | What Codex did |
| --- | --- | --- |
| 28 Oct, morning | "Help me build something for Twitch streamers and their community", with no idea yet | Proposed concepts, then worked through names with the creator (an early option was already taken). The creator chose **PopForge**. Codex scaffolded the React/Express/Socket.io app and the scene engine. |
| 28 Oct, afternoon | Make it more fun so viewers aren't bored, and give stressed streamers a warm, pleasant experience | Built the Cozy Lounge: original Canvas environments, hearts/lanterns, kindness jar, break and quiet-mode controls, and procedural music. |
| 28 Oct, evening | Test it live as the streamer and as a viewer | Walked the creator through registering the Twitch app, implemented OAuth and EventSub chat, and verified real commands sent from a second Twitch account. It also explained how the broadcaster's own chat messages are treated. |
| 29 Oct | How can bigger streamers help smaller ones, with something in return for both? Can we test with simulated viewers? | Designed and built **Creator Relay** (two communities, each with an equal share of the vote, explicit consent), plus a load lab that simulates many voters. |
| 30 Oct, early | Rethink whether streamers and viewers would actually use it. Do viewers need to log in? Put ease of use first, then creativity | Changed the product so viewers never leave Twitch chat and creators stay in OBS: quick-start moments, the compact OBS dock, gentle goals that one chatter can finish. Added the animated startup screen. |
| 30 Oct, day | "Help build all of this" | Added the runtime Codex SDK generator (sandboxed and schema-validated), private preview → publish, remembered Twitch authorization, and stable OBS source links. |
| 30 Oct, evening | Create the GitHub repo and a README that shows the judging criteria | Published the repo, README, Mermaid architecture, setup guide, and licenses. |
| 31 Oct, morning | Work on the biggest remaining opportunities, with OBS open | Built the **community world**: seeds earned from flowers, chat votes on landmarks, creator approval, persistence across streams. Added the downloadable OBS starter collection, then verified the full loop with real Twitch chat and OBS. |
| 31 Oct, late morning | The garden image looks static. Can a mug pour water when someone types `!water`? | Replaced the static reaction with distinct animations for `!water`, `!plant`, and `!cheer`, and captured them in OBS from real chat commands. |

## How the collaboration worked

- **The creator steered; Codex built and checked.** Most of the creator's prompts were product direction ("think more deeply about whether streamers will use this") or screenshots of something that looked off. Codex turned each one into code, tests, and a browser or OBS check.
- **Codex verified with real systems.** It ran the test suite and production build after changes, drove the studio in a browser to check layouts, and asked the creator to send real chat messages before calling a feature done.
- **Codex kept the docs honest.** It kept the claims in the docs to what had actually been tested. For example, Relay is described as a same-computer prototype because remote collaboration has not been tested.

## Codex at runtime

Choosing **Codex SDK** in the Scene workshop sends the creator's idea to a real `@openai/codex-sdk` thread ([server/generator.ts](../server/generator.ts)):

1. The thread runs in an isolated temporary directory with a read-only sandbox, no network or web search, a 90-second timeout, and the Twitch secrets removed from its environment.
2. Codex returns JSON that must match the scene schema. The server validates it again with Zod ([shared/engine.ts](../shared/engine.ts)), and only the four trusted mechanics are accepted.
3. The creator sees a private preview and decides whether to publish it to OBS. If generation fails, the studio shows an error instead of a fake result.

In a recorded run, Codex generated "Purple Community Garden" in 14 seconds, and the creator published it (runtime session `01a18c7c-4f21-76f1-a43a-f29d7ddb22bd`).
