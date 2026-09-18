# Active Work

- State: RUNNING
- Active development task: [ZOOID-0003 — External Live Provider Qualification](../tasks/ZOOID-0003-live-provider-qualification.md)
- Task ID: ZOOID-0003
- Owner: ChatGPT GitHub development session
- Branch: `agent/zooid-0003-live-provider-qualification`
- Base/main SHA: `cffc12030d345e9b04a63e918bff50c96b608a7b`
- Base post-merge workflow: `35359739796` SUCCESS — Ubuntu + Windows
- Current phase: Basic Provider Chat
- Last completed task: [ZOOID-0002](../tasks/ZOOID-0002-openai-compatible-provider.md)
- Current checkpoint: qualification harness implemented; deterministic CI pending
- Next action: verify harness on Ubuntu/Windows, then execute against an authorized real compatible endpoint if reachable
- Remaining gate: external real-model multi-turn qualification
- Router status: GATED
- Background execution: NOT_CONFIGURED

## Session recovery rule

Read `AGENTS.md`, this file, `STATUS.md`, then ZOOID-0003.

Do not mark a fixture run as external live evidence. If this execution context cannot reach the user's/local/provider endpoint, persist `BLOCKED_EXTERNAL_EXECUTION` with the exact command and environment contract needed for the next executor.
