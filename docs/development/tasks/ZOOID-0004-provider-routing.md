# ZOOID-0004 — Provider Routing Foundation

## Metadata

- ID: ZOOID-0004
- Status: IN_PROGRESS
- Started: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0004-provider-routing`
- Base/main SHA: `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`
- Base post-merge workflow: `35362601729` — SUCCESS, Ubuntu + Windows
- Previous task: [ZOOID-0003 — External Live Provider Qualification](ZOOID-0003-live-provider-qualification.md)
- Phase: Provider Routing
- Primary phase plan: [Provider Routing](../phases/provider-routing.md)

## Origin and reason

ZOOID-0003 closed Basic Provider Chat by proving a real two-turn persisted conversation through a local OpenAI-compatible Ollama endpoint.

The next user-directed phase is provider/model routing without changing Zooid session identity. The design must preserve a neutral transcript and make compatibility failures explicit before network dispatch.

Real host qualification also produced a practical constraint: the target Windows machine can run a small local model acceptably, while a 27B model was not responsive enough for an interactive qualification when Ollama reported 100% CPU execution. Router design must therefore remain viable with one small model and must not require parallel multi-model inference.

## Goal

Build the first deterministic Provider Router foundation so Zooid can:

1. register provider adapters through one validated registry;
2. describe provider/model capabilities explicitly;
3. reject duplicate/missing provider IDs and unsupported models before dispatch;
4. create an explicit route decision for each request;
5. keep route selection separate from persisted message/session identity;
6. support manual provider/model switching before any automatic fallback;
7. eventually prove A → B → A switching in one stable Zooid session.

## Non-goals

Not in ZOOID-0004:

- automatic fallback;
- latency/cost-based model selection;
- load balancing;
- multiple simultaneous local model inference;
- provider benchmarking/ranking;
- hidden retries;
- Ticket/Recovery semantics;
- silent conversion of unsupported payloads;
- context compression from the later Context phase.

## Architectural invariants

- Zooid owns session/message IDs; provider IDs are attribution/reference only.
- Neutral transcript is canonical.
- A route is a setting for the next request, not a rewrite of historical message attribution.
- Route must be snapshotted before dispatch.
- Changing route while a request is in-flight affects only the next request.
- Compatibility rejection happens before network I/O.
- Credentials are provider-scoped and must never cross provider boundaries.
- Unsupported content/roles are rejected explicitly rather than silently dropped.
- Manual switching precedes automatic routing policy.
- The baseline must work serially with a single small model.

## Work packages

### A — Provider capability and registry contract

Planned files:

- `src/providers/contracts.ts`
- `src/providers/registry.ts`
- `src/providers/provider-runtime.ts`
- `tests/provider-registry.test.ts`

Acceptance:

- [ ] ProviderDescriptor contract exists with stable provider ID and model/capability declarations.
- [ ] register at least two deterministic adapters/descriptors with different capabilities.
- [ ] duplicate provider ID is rejected.
- [ ] missing provider ID/model is rejected before provider dispatch.
- [ ] unsupported model is rejected before provider dispatch.
- [ ] unsupported role/content capability is explicit.
- [ ] registry tests require no network/model inference.

### B — Deterministic manual route decision

Planned files:

- `src/providers/router.ts`
- `tests/provider-router.test.ts`

Acceptance:

- [ ] RouteRequest contains session, selected provider/model and required capabilities.
- [ ] RouteDecision records route ID, provider/model, adapter revision, compatibility result and reason.
- [ ] route decision is deterministic for identical validated input.
- [ ] route rejects incompatibility before adapter/network call.
- [ ] no automatic fallback exists in this phase.

### C — Same-session switching

Planned touch points:

- `src/chat/chat-service.ts`
- `src/cli/chat.ts`
- session/message domain contract as required
- routing tests/smoke tests

Acceptance:

- [ ] CLI can show current provider/model.
- [ ] user can manually select the next route.
- [ ] A → B → A keeps one Zooid session ID and monotonic message sequence.
- [ ] B receives compatible history from neutral transcript.
- [ ] in-flight A result remains attributed to A even if next route switches to B.
- [ ] provider failure does not silently change route.
- [ ] smaller context/capability target produces explicit pre-dispatch rejection when applicable.

## Host-derived constraints

Observed on authorized device `CDQ-P` during ZOOID-0003:

- Windows 10 Pro build 19045
- Intel Core Ultra 5 245K, 14C/14T
- ~31.46 GB RAM
- Intel Graphics; no discrete GPU observed in the qualification snapshot
- Ollama 0.32.15
- `qwen3:1.7b` two-turn qualification PASS in ~16.08 s
- `qwen3.8:27b` qualification timed out at 180 s while Ollama reported 100% CPU

Design consequence:

Provider Routing tests must be deterministic and cheap. A live model may be used for a bounded acceptance smoke later, but normal router tests must not depend on multiple loaded models or parallel inference.

## Evidence rules

Every production change must record:

- exact tested SHA;
- workflow ID;
- Ubuntu/Windows result;
- test count;
- whether any live provider was used;
- secret handling;
- exact unresolved gaps.

## Progress

### 2026-09-18 — Task opened

- ZOOID-0003 merged via PR #3 to `main`.
- Verified main baseline `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`.
- Post-merge workflow `35362601729` completed SUCCESS on Ubuntu and Windows.
- Created branch `agent/zooid-0004-provider-routing`.
- Read the Provider Routing phase plan, system overview, requirements, decisions and quality gates before implementation.
- Chose deterministic registry/capability contract as the first implementation slice.

## Next action

Implement Work Package A using tests first, with no network dependency and no automatic fallback.
