# Development Status

**Updated:** 2026-09-18  
**Repository:** funggier/Zooid-Agent  
**Planning:** DOCUMENTED  
**Implementation:** IN_PROGRESS  
**Execution mode:** RUNNING  
**Active task:** ZOOID-0004 — Provider Routing Foundation  
**Working branch:** `agent/zooid-0004-provider-routing`  
**Verified main baseline:** `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`  
**Post-merge workflow:** `35362601729` — SUCCESS on Ubuntu + Windows

## Phase status

| Phase | Plan | Code | Acceptance |
| --- | --- | --- | --- |
| Basic provider chat | DOCUMENTED | COMPLETE | PASS — real local Ollama multi-turn |
| Provider routing | DOCUMENTED | REGISTRY_AND_MANUAL_ROUTER_VERIFIED; SWITCHING_IN_PROGRESS | PARTIAL |
| Durable tickets | DOCUMENTED | NOT_STARTED | NOT_RUN |
| Recovery | DOCUMENTED | NOT_STARTED | NOT_RUN |
| Context and Project | DOCUMENTED; four subplans | NOT_STARTED | NOT_RUN |
| Group coordination | DOCUMENTED | NOT_STARTED | NOT_RUN |
| Clean lifecycle | CROSS_PHASE_PLAN | FOUNDATION_RULES_APPLIED | PARTIAL |
| CNX baseline | AUDIT_PROTOCOL_DOCUMENTED | NOT_EVALUATED | NOT_RUN |

## Verified Basic Provider Chat capability

Zooid can:

- persist and reopen ordered sessions;
- use deterministic fake and OpenAI-compatible providers;
- normalize provider error/cancel/timeout behavior;
- execute a real local two-turn conversation;
- preserve history and recover an exact random marker through the same Zooid session.

Real qualification:
- device: `CDQ-P`
- endpoint: `http://127.0.0.1:11434/v1`
- model: `qwen3:1.7b`
- result: PASS
- message count: 4
- ordered transcript: true
- marker recovered: true
- runtime: ~16.08 s

## Current Router direction

ZOOID-0004 starts with deterministic ProviderDescriptor/Registry/Capability contracts and manual routing. Automatic fallback, cost/latency routing and parallel inference are explicitly deferred.

The baseline must work with one model and serial dispatch. The user explicitly requires `qwen3.8:27b`-only operation to remain supported even when inference is very slow. Small/helper models are optional optimizations, not dependencies. Timeout/watchdog behavior must therefore be configurable and must distinguish deliberate slow inference from actual failure.

## Verified Router foundation

At SHA `0c49d9d58b8c386209b461de6a64dbc7ac408e54`, Provider Registry/Capability tests passed 29/29 on Ubuntu and Windows in workflow `35365344223`.

Work Package B was developed RED → GREEN:
- RED SHA `dd61bec6b8f5efbf181763fac81a687ccee2cbdb`: expected missing-router failure.
- GREEN SHA `823d3ff9b5670729f5391a4d4c2f1774036847c3`: workflow `35365663955` SUCCESS on Ubuntu + Windows, 33/33 tests.

No automatic fallback or model inference is used by Router control-plane tests.

## Host execution note

The authorized Windows host was observed at ~51.33/51.46 GB committed memory with its fixed 20 GB pagefile effectively full. This caused local Node process/thread allocation failures. Clean GitHub runners remained green, so this is tracked separately from Zooid correctness.

## Next action

Integrate route snapshots into ChatService/CLI and prove A → B → A same-session switching without changing historical attribution.
