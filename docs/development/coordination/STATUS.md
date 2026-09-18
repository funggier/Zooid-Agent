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
| Provider routing | DOCUMENTED | IN_PROGRESS — ZOOID-0004 | NOT_RUN |
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

## Next action

Implement registry/capability RED tests and minimal production contract, then run Ubuntu/Windows CI.
