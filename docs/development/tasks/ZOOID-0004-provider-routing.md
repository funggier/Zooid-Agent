# ZOOID-0004 — Provider Routing Foundation

## Metadata

- ID: ZOOID-0004
- Status: COMPLETE
- Started: 2026-09-18
- Completed: 2026-09-19
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0004-provider-routing`
- Base/main SHA: `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`
- Base post-merge workflow: `35362601729` — SUCCESS, Ubuntu + Windows
- Previous task: [ZOOID-0003 — External Live Provider Qualification](ZOOID-0003-live-provider-qualification.md)
- Phase: Provider Routing
- Primary phase plan: [Provider Routing](../phases/provider-routing.md)
- Verified implementation SHA: `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1`
- Verified implementation workflow: `35374806274` — SUCCESS, Ubuntu + Windows, 40/40 tests
- Live acceptance head: `8aab78abaf070e3a605a7304aad63033ff8e975e`
- Pull request: #4 — MERGED
- Merge/main SHA: `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`
- Post-merge workflow: `35375409259` — SUCCESS, Ubuntu + Windows
- Final report: [ZOOID-0004 Provider Routing Foundation Report](../reports/ZOOID-0004-provider-routing-report.md)

## Origin and reason

ZOOID-0003 closed Basic Provider Chat by proving a real two-turn persisted conversation through a local OpenAI-compatible Ollama endpoint.

The next user-directed phase is provider/model routing without changing Zooid session identity. The design must preserve a neutral transcript and make compatibility failures explicit before network dispatch.

Real host qualification also produced a practical constraint: the target Windows machine can run a small local model acceptably, while a 27B model was not responsive enough for the original interactive qualification window when Ollama reported 100% CPU execution. The user explicitly requires that Zooid must also remain fully usable with `qwen3.8:27b` as the **only** model, even when it is very slow. Router design therefore must support both small-model operation and slow single-large-model operation without requiring helper models or parallel multi-model inference.

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
- The baseline must work serially with a single model of any supported size.
- `qwen3.8:27b`-only operation is an explicit USER_DIRECTION: slow inference is acceptable and must not be classified as failure merely because it exceeds an interactive latency expectation.
- Router/controller logic must not depend on a second "helper" model.
- Provider timeout must be configurable so deliberately slow local inference can be allowed to finish.
- Durable/in-flight state must remain correct while a slow model is still computing; changing route must not corrupt attribution.
- Deterministic control-plane work should avoid unnecessary LLM calls so a single slow model is spent on work that actually requires model intelligence.

## Work packages

### A — Provider capability and registry contract

Planned files:

- `src/providers/contracts.ts`
- `src/providers/registry.ts`
- `src/providers/provider-runtime.ts`
- `tests/provider-registry.test.ts`

Acceptance:

- [x] ProviderDescriptor contract exists with stable provider ID and model/capability declarations.
- [x] register at least two deterministic adapters/descriptors with different capabilities.
- [x] duplicate provider ID is rejected.
- [x] missing provider ID/model is rejected before provider dispatch.
- [x] unsupported model is rejected before provider dispatch.
- [x] unsupported role/content capability is explicit.
- [x] registry tests require no network/model inference.

### B — Deterministic manual route decision

Planned files:

- `src/providers/router.ts`
- `tests/provider-router.test.ts`

Acceptance:

- [x] RouteRequest contains session, selected provider/model and required capabilities.
- [x] RouteDecision records route ID, provider/model, adapter revision, compatibility result and reason.
- [x] route decision is deterministic for identical validated input.
- [x] route rejects incompatibility before adapter/network call.
- [x] no automatic fallback exists in this phase.

### C — Same-session switching

Planned touch points:

- `src/chat/chat-service.ts`
- `src/cli/chat.ts`
- session/message domain contract as required
- routing tests/smoke tests

Acceptance:

- [x] CLI can show current provider/model.
- [x] user can manually select the next route.
- [x] A → B → A keeps one Zooid session ID and monotonic message sequence.
- [x] B receives compatible history from neutral transcript.
- [x] in-flight A result remains attributed to A even if next route switches to B.
- [x] provider failure does not silently change route.
- [x] smaller context/capability target produces explicit pre-dispatch rejection when applicable.

### Follow-on — Provider configuration and discovery

This direction remains approved, but its implementation is **not part of ZOOID-0004 closure**. It moves to the next numbered task, ZOOID-0005, so Provider Routing Foundation can close on a tested boundary instead of expanding indefinitely.

ZOOID-0005 acceptance direction:

- [ ] Adapter, Provider Instance and Model are separate identities.
- [ ] provider endpoint/account using an existing adapter can be added/disabled/removed through configuration without production source edits.
- [ ] model can be added/disabled/removed through configuration without production source edits.
- [ ] a genuinely new provider protocol requires a new adapter, not Router special cases.
- [ ] prefer `disabled` over destructive removal for reversible operation.
- [ ] `unavailable` is distinct from `disabled`.
- [ ] discovery is read-only by default and never auto-enables a discovered model.
- [ ] routable model set is derived from provider availability plus explicit Zooid enablement.
- [ ] provider/model removal does not erase historical provider/model/route attribution.
- [ ] credentials remain provider-scoped; ordinary config/logs contain references rather than secret material.
- [ ] future CLI/UI/API share one Provider Configuration Service rather than duplicating management logic.

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

The earlier 180-second timeout is evidence about the chosen timeout/window, not evidence that `qwen3.8:27b` is unsupported. A later acceptance path must explicitly allow an extended timeout/no premature watchdog failure and prove that Zooid can wait safely for a single slow large model.

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

### 2026-09-18 — Single slow large-model requirement added

- User explicitly required that Zooid must be able to operate with `qwen3.8:27b` as the only model even if it is very slow.
- Small models remain useful optional resources, not architectural requirements.
- Router/controller must not require a helper model, parallel inference, or latency-based failover.
- Slow inference must be distinguishable from provider failure through configurable timeout/cancellation semantics.
- A future live acceptance will re-run the large model with an intentionally extended waiting policy rather than the earlier 180-second interactive gate.

### 2026-09-18 — Work Package A verified

TDD:
- RED observed locally before implementation: `ERR_MODULE_NOT_FOUND` for `src/providers/registry.ts`.
- Production/test commit: `0c49d9d58b8c386209b461de6a64dbc7ac408e54`.
- Workflow: `35365344223` — SUCCESS on Ubuntu + Windows.
- Tests: 29 passed / 0 failed.
- No live provider/model/network dispatch used by registry tests.

Implemented:
- `ProviderDescriptor`
- `ProviderRequirements`
- `ProviderCompatibilityResult`
- `ProviderRegistry`
- explicit registry error codes
- deterministic capability evaluation for role/content/streaming/usage/context requirements.

The planned `provider-runtime.ts` integration was intentionally not expanded in this slice; the existing runtime remains unchanged until route selection is integrated into ChatService/CLI.

### 2026-09-18 — Work Package B verified

TDD RED:
- test-only commit: `dd61bec6b8f5efbf181763fac81a687ccee2cbdb`
- workflow: `35365567556`
- expected failure: 29 pass / 1 fail
- exact failure: `ERR_MODULE_NOT_FOUND` for `src/providers/router.ts`.

Minimal GREEN:
- implementation SHA: `823d3ff9b5670729f5391a4d4c2f1774036847c3`
- workflow: `35365663955` — SUCCESS on Ubuntu + Windows
- tests: 33 passed / 0 failed

Verified behavior:
- explicit provider/model selection only;
- deterministic route snapshot and route ID;
- adapter revision recorded in the decision;
- incompatible capabilities return a rejected decision before dispatch;
- unknown provider and unsupported model fail before dispatch;
- no automatic fallback from an incompatible selected provider to another compatible provider;
- switching explicit provider changes the route snapshot while preserving Zooid session identity.

### 2026-09-18 — Local Windows resource-pressure observation

During local verification, Windows reported approximately 51.33 GB committed out of a 51.46 GB commit limit. The fixed 20 GB pagefile was effectively full and automatic pagefile management was disabled. Under that host pressure, Node test processes produced heap/thread-start failures even though GitHub clean runners passed the same repository.

This is recorded as host environment pressure, not a Zooid regression. No pagefile setting and no unrelated running model/process was changed automatically.

### 2026-09-18 — Provider/model configuration semantics added

User approved the Provider management direction and requested it be retained in the development plan.

Recorded rules:
- Adapter ≠ Provider Instance ≠ Model.
- adding/removing a model under an existing provider should be configuration-only;
- adding another endpoint/account using an existing protocol should be configuration-only;
- a genuinely new protocol requires a new adapter;
- discovered/installed does not imply enabled/routable;
- `routable = available ∩ enabled`;
- prefer reversible disable state before destructive removal;
- removal/disable affects new routing only and must not rewrite historical provenance;
- credentials belong to provider instances rather than individual models;
- CLI and later UI/API must share one management service.

### 2026-09-18 — Work Package C1 routed ChatService verified

TDD RED:
- test-only SHA: `aff7f8bca16f64fa292aa64e94dbb6bffb3f15b5`
- workflow: `35374402511`
- expected failure: 33 existing tests passed; new routed-chat test file failed because route-aware ChatService behavior did not yet exist.

Minimal GREEN:
- implementation SHA: `42c362929fd9c0b842d250502bb004aa5728ba5e`
- workflow: `35374568973` — SUCCESS Ubuntu + Windows
- tests: 38 passed / 0 failed

Verified:
- selected route is snapshotted before provider dispatch;
- the pending user message persists routeId/requestId/providerId/model/adapterRevision before network work starts;
- assistant response preserves the exact same route snapshot plus provider response ID;
- A → B → A keeps one Zooid session and monotonic sequence;
- B receives neutral prior user/assistant transcript rather than provider-private state;
- changing the selected next route while A is in-flight does not relabel A's response;
- provider failure preserves route provenance and does not dispatch B;
- incompatible capability selection rejects before transcript mutation or dispatch;
- legacy ChatService construction remains supported for existing qualification code.

### 2026-09-18 — Work Package C2 CLI routing verified

TDD RED:
- test-only SHA: `dbbb126a775da74f265037714af6e161a74bf548`
- workflow: `35374705926`
- expected failure: 38 pass / 2 fail because `/route` was still treated as normal chat input.

Minimal GREEN:
- implementation SHA: `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1`
- workflow: `35374806274` — SUCCESS Ubuntu + Windows
- tests: 40 passed / 0 failed

Verified:
- CLI production path now constructs ProviderRegistry → ProviderRouter → routed ChatService;
- provider runtime exposes a stable ProviderDescriptor;
- `/route` shows the current provider/model;
- `/route <provider-id> <model>` validates provider/model before changing the next route;
- invalid selection leaves the previous route active;
- CLI-routed messages persist provider/model/route attribution.

### 2026-09-19 — Real routed CLI acceptance PASS

Authorized host: `CDQ-P`

Exact source:
- clean clone: `T:\\Zooid-Agent-routing-acceptance`
- HEAD: `8aab78abaf070e3a605a7304aad63033ff8e975e`
- implementation under test: `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1` plus documentation-only closure commits

Runtime:
- Ollama `0.32.15`
- endpoint: `http://127.0.0.1:11434/v1`
- provider: `openai-compatible`
- model: `qwen3:1.7b`
- adapter revision: `openai-compatible-chat-completions-r1`
- timeout setting: 120000 ms
- authentication: none

Observed:
- CLI showed current route `openai-compatible/qwen3:1.7b`;
- real response contained exact token `ROUTED_OK`;
- CLI exit code: 0;
- persisted messages: 2;
- both message statuses: `complete`;
- user and assistant persisted the same route ID;
- provider response ID was persisted;
- evidence summary outcome: PASS;
- local evidence root: `T:\\Zooid-Agent-routing-evidence\\20260919T003339`.

Host resource note:
- committed memory was ~50.79 / 51.46 GB;
- fixed 20 GB pagefile remained effectively full;
- both `qwen3:1.7b` and `qwen3.8:27b` were already resident in Ollama;
- no model/process was stopped or reconfigured for this acceptance.

A first shell wrapper attempt failed before Zooid execution because of Windows `cmd /c` quoting around an evidence path. The acceptance was re-run with a PowerShell pipeline using the same clean clone and source SHA; no source repair was required.

### Large-model boundary

This task does **not** claim a routed live PASS for `qwen3.8:27b`.

The user requirement remains: Zooid must support `qwen3.8:27b` as the only model even when inference is very slow. The earlier 180-second timeout remains a timeout-window/performance observation, not evidence of unsupported behavior. A dedicated slow-model acceptance with deliberately extended waiting policy remains required later.

## Result

**PASS**

- Provider registry/capability contract: VERIFIED
- deterministic manual router: VERIFIED
- no silent fallback: VERIFIED
- route snapshot before dispatch: VERIFIED
- durable provider/model/adapter attribution: VERIFIED
- A → B → A same-session switching: VERIFIED
- in-flight next-route change does not relabel prior request: VERIFIED
- CLI Registry → Router → ChatService path: VERIFIED
- real local Ollama routed CLI: VERIFIED with `qwen3:1.7b`
- dedicated `qwen3.8:27b` slow live acceptance: DEFERRED, still required
- Provider Configuration/Discovery implementation: MOVED TO ZOOID-0005

## Final merge evidence

- PR #4 closure push workflow `35375253456`: SUCCESS — Ubuntu + Windows.
- PR #4 workflow `35375258060`: SUCCESS — Ubuntu + Windows.
- PR #4 merged with merge commit `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`.
- `main` was verified at the exact merge SHA.
- post-merge workflow `35375409259`: SUCCESS — Ubuntu + Windows.

## Next action

Continue the approved Provider Configuration/Discovery follow-on as ZOOID-0005 from the verified merge baseline.
