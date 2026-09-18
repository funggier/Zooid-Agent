# Active Work

- State: RUNNING
- Active development task: [ZOOID-0004 — Provider Routing Foundation](../tasks/ZOOID-0004-provider-routing.md)
- Task ID: ZOOID-0004
- Branch: `agent/zooid-0004-provider-routing`
- Base/main SHA: `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`
- Base post-merge workflow: `35362601729` SUCCESS — Ubuntu + Windows
- Previous completed task: ZOOID-0003 — real local Ollama multi-turn PASS
- Current phase: Provider Routing
- Current slice: Provider capability + registry contract
- Next action: RED tests for registry/capability validation, then minimal implementation
- Automatic fallback: DEFERRED
- Parallel model inference requirement: NONE
- Single-model requirement: MUST support `qwen3.8:27b`-only operation even with very high latency
- Helper model requirement: NONE
- Slow-model policy: configurable timeout; slowness alone is not provider failure
- Background execution: NOT_CONFIGURED

## Session recovery rule

Read `AGENTS.md`, this file, `STATUS.md`, ZOOID-0004 and the Provider Routing phase plan.

The real host evidence from ZOOID-0003 is a design constraint: router correctness must remain testable without loading multiple real models. Both one-small-model operation and `qwen3.8:27b`-only slow operation must remain viable.
