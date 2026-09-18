# Active Work

- State: RUNNING
- Active development task: [ZOOID-0004 — Provider Routing Foundation](../tasks/ZOOID-0004-provider-routing.md)
- Task ID: ZOOID-0004
- Branch: `agent/zooid-0004-provider-routing`
- Base/main SHA: `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`
- Base post-merge workflow: `35362601729` SUCCESS — Ubuntu + Windows
- Previous completed task: ZOOID-0003 — real local Ollama multi-turn PASS
- Current phase: Provider Routing
- Current slice: Routed CLI live acceptance
- Next action: run real local Ollama routed-CLI acceptance with qwen3:1.7b, then close ZOOID-0004 if evidence is clean
- Automatic fallback: DEFERRED
- Parallel model inference requirement: NONE
- Single-model requirement: MUST support `qwen3.8:27b`-only operation even with very high latency
- Helper model requirement: NONE
- Slow-model policy: configurable timeout; slowness alone is not provider failure
- Background execution: NOT_CONFIGURED

## Session recovery rule

Read `AGENTS.md`, this file, `STATUS.md`, ZOOID-0004 and the Provider Routing phase plan.

The real host evidence from ZOOID-0003 is a design constraint: router correctness must remain testable without loading multiple real models. Both one-small-model operation and `qwen3.8:27b`-only slow operation must remain viable.


## Verified ZOOID-0004 evidence

- Work Package A SHA: `0c49d9d58b8c386209b461de6a64dbc7ac408e54`
- A workflow: `35365344223` — SUCCESS, 29/29
- Work Package B RED SHA: `dd61bec6b8f5efbf181763fac81a687ccee2cbdb`
- B RED workflow: `35365567556` — expected failure, missing router implementation
- Work Package B GREEN SHA: `823d3ff9b5670729f5391a4d4c2f1774036847c3`
- B workflow: `35365663955` — SUCCESS, 33/33


## Work Package C verified

- C1 RED SHA: `aff7f8bca16f64fa292aa64e94dbb6bffb3f15b5`
- C1 GREEN SHA: `42c362929fd9c0b842d250502bb004aa5728ba5e`
- C1 workflow: `35374568973` — SUCCESS, 38/38
- C2 RED SHA: `dbbb126a775da74f265037714af6e161a74bf548`
- C2 GREEN SHA: `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1`
- C2 workflow: `35374806274` — SUCCESS, 40/40
