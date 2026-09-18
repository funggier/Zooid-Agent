# Active Work

- State: WAITING_FOR_MERGE
- Active development task: [ZOOID-0004 — Provider Routing Foundation](../tasks/ZOOID-0004-provider-routing.md)
- Task ID: ZOOID-0004
- Branch: `agent/zooid-0004-provider-routing`
- Base/main SHA: `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`
- Pull request: #4
- Verified implementation SHA: `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1`
- Verified implementation workflow: `35374806274` SUCCESS — Ubuntu + Windows — 40/40
- Live routed acceptance head: `8aab78abaf070e3a605a7304aad63033ff8e975e`
- Live routed acceptance: PASS — local Ollama `qwen3:1.7b`
- Next action: verify closure-doc CI, mark PR #4 ready, merge, verify post-merge `main`, then open ZOOID-0005
- Next numbered scope: Provider Configuration/Discovery
- Automatic fallback: DEFERRED
- Parallel model inference requirement: NONE
- Single-model requirement: MUST support `qwen3.8:27b`-only operation even with very high latency
- Helper model requirement: NONE
- Slow-model policy: configurable timeout; slowness alone is not provider failure
- Background execution: NOT_CONFIGURED

## Session recovery rule

Read `AGENTS.md`, this file, `STATUS.md`, ZOOID-0004 and the final ZOOID-0004 report.

Do not expand PR #4 with Provider Configuration/Discovery. That scope moves to ZOOID-0005 after the exact post-merge baseline is verified.

## Verified ZOOID-0004 evidence

- A SHA: `0c49d9d58b8c386209b461de6a64dbc7ac408e54` — workflow `35365344223` — 29/29
- B RED: `dd61bec6b8f5efbf181763fac81a687ccee2cbdb` — expected failure
- B GREEN: `823d3ff9b5670729f5391a4d4c2f1774036847c3` — workflow `35365663955` — 33/33
- C1 RED: `aff7f8bca16f64fa292aa64e94dbb6bffb3f15b5` — expected failure
- C1 GREEN: `42c362929fd9c0b842d250502bb004aa5728ba5e` — workflow `35374568973` — 38/38
- C2 RED: `dbbb126a775da74f265037714af6e161a74bf548` — expected failure
- C2 GREEN: `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1` — workflow `35374806274` — 40/40
- Live routed CLI: PASS at head `8aab78abaf070e3a605a7304aad63033ff8e975e`
