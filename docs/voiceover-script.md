# ZKNative Voiceover Script

## Purpose

This script is designed for a **4-minute hackathon video** where you screen record the **full frontend journey** of ZKNative.

The goal is to communicate three things clearly:

1. **ZKNative is not just one app**. It is a reusable privacy platform.
2. **Its core advantage is native Rust ZK verification on Polkadot via PolkaVM**.
3. **Developers can now create their own custom use case** through the ZKNative Studio.

## Recommended Recording Flow

Open these routes in order before you start recording:

1. `/`
2. `/use-cases`
3. `/vote`
4. `/airdrop`
5. `/access`
6. `/studio`
7. `/results`
8. `/benchmark`

## Recording Notes

- Keep browser zoom between **90% and 100%** so the layout breathes.
- Record in a desktop viewport.
- Scroll slowly and intentionally.
- On the `vote` page, do the **full interaction**.
- On `airdrop` and `access`, show the structure and explain reuse rather than doing the full end-to-end flow again.
- In `studio`, focus on **template selection, live preview, and exported snippets**.
- Speak slightly slower than normal. Four minutes is enough if you avoid long pauses.

---

## Timecoded Demo Script

| Time | Screen Action | Voiceover |
|------|---------------|-----------|
| `0:00 - 0:20` | Start on the homepage hero. Pause on the title, then scroll slightly to the live demos section. | "This is ZKNative, a privacy-first application platform built on Polkadot. At the core is a native Rust Groth16 verifier that can be called from Solidity through PolkaVM, so private on-chain applications become dramatically cheaper and more flexible to build." |
| `0:20 - 0:35` | Stay on the homepage and briefly show the three demo cards plus the architecture section. | "Instead of shipping one isolated demo, ZKNative now presents a reusable pattern: private voting, stealth airdrop claims, anonymous access passes, and a developer studio for creating more custom use cases on the same verifier path." |
| `0:35 - 0:55` | Open `/use-cases`. Pause on the cards, then scroll to the matrix and the Studio CTA. | "This page frames ZKNative as a platform. Each use case uses the same proof architecture: a frontend generates a proof, a Solidity consumer contract enforces business rules, and ZKNativeVerifier sends the heavy cryptography to native Rust on Polkadot." |
| `0:55 - 1:35` | Open `/vote`. Click through connect, choose a scenario and vote choice, generate proof, continue, and submit. | "Here is the private voting flow. I connect in demo mode, choose a proposal, choose a vote, and generate a context-bound proof. The important idea is that the chain sees the proposal, the vote choice, and a nullifier, but not the wallet identity behind the vote. This is the same privacy pattern many governance systems want, but usually cannot afford to verify efficiently on-chain." |
| `1:35 - 1:55` | Open `/airdrop`. Show the campaign cards, the claim tiers, and the signal preview panel. | "The exact same verifier pattern also works for stealth airdrops. Here, instead of voting, an eligible user proves membership in a campaign allowlist and redeems a reward tier without revealing which qualifying address they control." |
| `1:55 - 2:15` | Open `/access`. Show the program cards, access levels, and contract call. | "And here is anonymous access control. A member can mint or activate a pass for an event or program, while the smart contract only learns the program, the access level, and a one-time nullifier. The identity remains private, but the action is still enforceable on-chain." |
| `2:15 - 3:05` | Open `/studio`. Show the template buttons, edit a few fields, scroll through scenarios/actions, then show the export panels and the live preview. | "This is the part I’m most excited about: the ZKNative Studio. A developer can start from a blank template or reuse one of the built-in flows, then customize the title, contract call, signal labels, scenarios, actions, proof checklist, and technical notes. On the right, they get a live card preview, exportable JSON, a TypeScript config snippet, a route scaffold, and even an integration guide. In other words, ZKNative is becoming a productized toolkit for building custom privacy apps, not just a single frontend demo." |
| `3:05 - 3:25` | Open `/results`. Pause on the tallies and bars. | "The results page reinforces the privacy model: the aggregate outcome is public, but the individual participants remain hidden. This is the right mental model for many privacy-preserving apps on-chain: public state transition, private user identity." |
| `3:25 - 3:50` | Open `/benchmark`. Pause on the chart and the detailed table. | "And here is the economic payoff. Verification through the native Rust path is far cheaper than a pure Solidity verifier. That means ZKNative is not only more expressive for developers, it is also more realistic for production-grade usage on Polkadot." |
| `3:50 - 4:00` | Return to the top of the benchmark or back to the homepage logo if you prefer a cleaner close. | "ZKNative shows what becomes possible when Solidity applications can call native Rust verification through PolkaVM: cheaper proofs, reusable privacy patterns, and now a studio for developers to create their own custom use cases." |

---

## Full Read-Aloud Script

Use this section if you want one continuous narration instead of reading the table.

> This is ZKNative, a privacy-first application platform built on Polkadot. At the core is a native Rust Groth16 verifier that can be called from Solidity through PolkaVM, so private on-chain applications become dramatically cheaper and more flexible to build.
>
> Instead of shipping one isolated demo, ZKNative now presents a reusable pattern: private voting, stealth airdrop claims, anonymous access passes, and a developer studio for creating more custom use cases on the same verifier path.
>
> On the use cases page, you can see that each flow shares the same architecture. The frontend generates the proof, a Solidity consumer contract checks the application rules, and ZKNativeVerifier sends proof verification into native Rust on Polkadot.
>
> Here is the private voting flow. I connect in demo mode, choose a proposal, choose a vote, and generate a context-bound proof. The chain learns the proposal, the vote choice, and a nullifier, but it does not learn which wallet cast that vote. This is exactly the kind of privacy-preserving governance pattern that is expensive in a pure EVM environment.
>
> The same verifier pattern also supports stealth airdrops. Here, a user proves that they belong to a campaign allowlist and redeems a reward tier without exposing the qualifying wallet. The business logic changes, but the verifier path stays the same.
>
> We can also use the same approach for anonymous access passes. In this flow, a user activates an event or program credential without publicly linking their address to the membership list behind it.
>
> The developer studio pushes ZKNative from demo to platform. A builder can start from a blank template or reuse one of the existing flows, edit the contract call, signal semantics, scenarios, action paths, and proof checklist, then immediately preview the custom use case. The studio also exports JSON, TypeScript config, a route scaffold, and an integration guide. So ZKNative is not only showing privacy applications, it is helping developers create new ones quickly.
>
> On the results page, we reinforce the core privacy idea: the aggregate state is public, but the participating identity stays private.
>
> And on the benchmark page, we show why this matters economically. Verification through native Rust is dramatically cheaper than a Solidity-only path, which makes these privacy-preserving applications much more realistic to deploy on Polkadot.
>
> ZKNative shows what becomes possible when Solidity applications can call native Rust verification through PolkaVM: cheaper proofs, reusable privacy patterns, and a studio where developers can design their own custom privacy use cases.

---

## Fast Fallback Version (~2 minutes)

Use this if you run out of time before submission.

> ZKNative is a privacy-first application platform on Polkadot. Its key innovation is that Solidity contracts can delegate Groth16 verification to a native Rust verifier through PolkaVM, making privacy-preserving applications cheaper and more scalable.
>
> On the frontend, we now show three reusable patterns: private voting, stealth airdrop claims, and anonymous access passes. Each one uses the same architecture: browser proof generation, Solidity business logic, and native Rust verification.
>
> The private voting flow shows the full end-to-end interaction: a user selects a proposal, generates a proof, and submits a private vote without revealing their wallet identity.
>
> The airdrop and access pages prove that ZKNative is a reusable verifier platform, not a single-purpose demo.
>
> The new Studio takes that one step further. Developers can configure their own use case, preview it live, and export the config, route scaffold, and integration notes needed to turn it into a real ZKNative app.
>
> Finally, the benchmark page shows why this matters: native Rust verification on Polkadot is significantly cheaper than a Solidity-only verifier, which is what makes these private applications practical.

---

## Presenter Cues

### Best phrases to emphasize

- "Native Rust verifier"
- "Callable from Solidity through PolkaVM"
- "Reusable privacy pattern"
- "Context-bound nullifier"
- "Platform, not just one app"
- "Developer studio for custom use cases"

### If judges ask what is new in this build

Say:

> "We expanded ZKNative from a single private voting demo into a small privacy application platform with three concrete flows and a studio that lets developers design and export new use cases."

### If you need one closing sentence

Use:

> "ZKNative combines Polkadot’s execution flexibility with privacy-preserving UX, and now gives developers a path to create their own custom ZK applications on top of the same verifier core."

