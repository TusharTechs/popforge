# From local companion to hosted product

The public PopForge Site is an account-free browser rehearsal. The complete Twitch/OBS companion runs on the creator’s computer. Viewers already participate remotely through Twitch chat without signing into PopForge. The implemented setup assistant, persistent authorization, OBS collection export, and dock reduce repeat setup; each new creator still configures a Twitch developer application.

A hosted product should use one registered production Twitch application and creator OAuth, so ordinary creators do not become application developers. This is a roadmap, not an implemented capability. Before offering it:

| Gate | Acceptance evidence needed |
| --- | --- |
| Creator identity | HTTPS OAuth, session lifecycle, revocation and channel ownership checks |
| Tenant isolation | Per-channel authorization, state, event routing, source revocation, and tests proving channels cannot read or control each other |
| Durable service | Managed secrets, encrypted token lifecycle, durable event storage, backups and recovery, monitoring, deployment operations |
| Transport | Real multi-device and Internet latency/reconnect tests; measured bounded behavior under chat bursts |
| Runtime generation | Authorized isolated generation service; current Codex CLI subprocess cannot simply run inside the static Site or its Worker runtime |
| Adoption | Independent first-setup observations, help needed, voluntary second-broadcast use; retention claims require a separate study |
| Remote Relay | Two real broadcaster consents, guest credential lifecycle, simultaneous chat, withdrawal and reconnect tests |

Do not expose the local bootstrap endpoint as public authentication. Hosting the frontend alone does not establish these gates. Current localhost load measurements are useful regression evidence, not a supported audience-size guarantee.

A possible business hypothesis is creator-paid convenience and original scene packs with free viewer participation. There is no billing implementation, validated pricing, or demonstrated demand yet. Test usefulness with independent creators before monetizing.
