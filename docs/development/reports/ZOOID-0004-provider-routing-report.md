# ZOOID-0004 — Provider Routing Foundation Report

## Result

**PASS**

ZOOID-0004 establishes the first verified Provider Routing boundary for Zooid: deterministic provider/model selection, explicit capability rejection, durable route provenance, same-session switching and a production CLI path routed through Registry and Router.

## Repository evidence

- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0004-provider-routing`
- Base/main: `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`
- Pull request: #4
- Verified implementation SHA: `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1`
- Verified implementation workflow: `35374806274`
- CI result: SUCCESS on Ubuntu + Windows
- tests: 40 passed / 0 failed
- Live routed acceptance head: `8aab78abaf070e3a605a7304aad63033ff8e975e`

## TDD evidence

### Provider registry and capability contract

Implementation:
- SHA `0c49d9d58b8c386209b461de6a64dbc7ac408e54`
- workflow `35365344223`
- 29/29 tests
- Ubuntu + Windows: PASS

Verified:
- stable provider descriptor;
- duplicate provider rejection;
- unsupported provider/model rejection before dispatch;
- deterministic role/content/streaming/usage/context capability evaluation;
- no network/model inference required for control-plane tests.

### Deterministic manual Router

RED:
- SHA `dd61bec6b8f5efbf181763fac81a687ccee2cbdb`
- workflow `35365567556`
- expected failure because `src/providers/router.ts` did not yet exist.

GREEN:
- SHA `823d3ff9b5670729f5391a4d4c2f1774036847c3`
- workflow `35365663955`
- 33/33 tests
- Ubuntu + Windows: PASS

Verified:
- explicit selected provider/model;
- deterministic route decision and route ID;
- adapter revision captured;
- incompatibility rejected before dispatch;
- no automatic fallback.

### Routed ChatService and same-session switching

RED:
- SHA `aff7f8bca16f64fa292aa64e94dbb6bffb3f15b5`
- workflow `35374402511`
- existing tests stayed green; new routed-chat contract failed as intended.

GREEN:
- SHA `42c362929fd9c0b842d250502bb004aa5728ba5e`
- workflow `35374568973`
- 38/38 tests
- Ubuntu + Windows: PASS

Verified:
- route selection snapshotted for each request;
- route provenance persisted on the pending user message before provider dispatch;
- assistant response preserves the same route and provider response ID;
- A → B → A keeps one Zooid session ID and monotonic sequence;
- B receives the neutral user/assistant transcript;
- changing the next route while A is in-flight does not relabel A;
- provider failure does not dispatch another provider;
- incompatible route rejection occurs before transcript mutation/network I/O.

### Routed CLI

RED:
- SHA `dbbb126a775da74f265037714af6e161a74bf548`
- workflow `35374705926`
- 38 existing tests passed; two new CLI route tests failed because `/route` was still treated as chat text.

GREEN:
- SHA `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1`
- workflow `35374806274`
- 40/40 tests
- Ubuntu + Windows: PASS

Verified production path:
`CLI → ProviderRegistry → ProviderRouter → ChatService → Provider Adapter`

Commands:
- `/route`
- `/route <provider-id> <model>`

Invalid provider/model selection is rejected immediately and leaves the previous route active.

## Real routed provider acceptance

Authorized host:
- device: `CDQ-P`
- OS family: Windows 10 Pro
- Ollama: `0.32.15`

Source:
- clean clone: `T:\\Zooid-Agent-routing-acceptance`
- exact HEAD: `8aab78abaf070e3a605a7304aad63033ff8e975e`

Provider:
- provider ID: `openai-compatible`
- base URL: `http://127.0.0.1:11434/v1`
- model: `qwen3:1.7b`
- adapter revision: `openai-compatible-chat-completions-r1`
- timeout: 120000 ms
- authentication: none

Observed sanitized result:

```json
{
  "outcome": "PASS",
  "head": "8aab78abaf070e3a605a7304aad63033ff8e975e",
  "provider": "openai-compatible",
  "model": "qwen3:1.7b",
  "adapterRevision": "openai-compatible-chat-completions-r1",
  "routeId": "route-4301c113f867846cfa9d1831",
  "sameRoute": true,
  "messageCount": 2,
  "statuses": ["complete", "complete"],
  "providerResponseIdPresent": true,
  "responseContainsToken": true
}
```

CLI output included:
- current route: `openai-compatible/qwen3:1.7b`
- real assistant response token: `ROUTED_OK`
- exit code: 0

Local evidence root:
`T:\\Zooid-Agent-routing-evidence\\20260919T003339`

No provider secret was used or written to repository evidence.

## Host resource observation

Immediately before acceptance:
- Windows committed memory: ~50.79 GB
- commit limit: ~51.46 GB
- free physical RAM: ~12.69 GB
- fixed pagefile: 20 GB, effectively fully used
- Ollama had both `qwen3:1.7b` and `qwen3.8:27b` resident.

The acceptance did not stop, unload or reconfigure unrelated models/processes.

An initial command wrapper failed before Zooid execution because of Windows `cmd /c` quoting around the evidence input path. The same source was then executed with a direct PowerShell pipeline and passed. No source repair was needed for that wrapper failure.

## qwen3.8:27b boundary

The user explicitly requires Zooid to remain usable with `qwen3.8:27b` as the only model even when inference is extremely slow.

ZOOID-0004 does not claim a new routed live PASS for that model.

The prior 180-second timeout is retained only as evidence that the chosen qualification window was too short under the observed CPU-only/high-pressure host state. It must not be interpreted as an unsupported model.

A future dedicated slow-model qualification must:
- use an intentionally extended/configurable waiting policy;
- avoid treating interactive latency as provider failure;
- preserve pending route provenance while inference is running;
- verify final attribution if the request eventually completes.

The routed ChatService contract created in ZOOID-0004 is specifically designed to preserve that in-flight provenance.

## Provider configuration follow-on

User-approved provider management rules are documented but implementation is moved to ZOOID-0005:

- Adapter ≠ Provider Instance ≠ Model;
- existing-protocol provider/model changes should be configuration-only;
- new protocol requires a new adapter;
- discovered does not imply enabled;
- routable = available ∩ explicitly enabled;
- disabled/unavailable/removed remain distinct;
- removal does not erase historical attribution;
- credentials are provider-scoped;
- CLI/UI/API must share one Provider Configuration Service.

## Final status

**ZOOID-0004 COMPLETE**

Provider Routing Foundation is qualified for merge through PR #4.

Next:
1. verify closure CI;
2. merge PR #4;
3. verify post-merge CI on main;
4. open ZOOID-0005 Provider Configuration/Discovery from the exact merged baseline.
