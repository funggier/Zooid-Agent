# Active Work

- State: BLOCKED_EXTERNAL_EXECUTION
- Active development task: [ZOOID-0003 — External Live Provider Qualification](../tasks/ZOOID-0003-live-provider-qualification.md)
- Task ID: ZOOID-0003
- Branch: `agent/zooid-0003-live-provider-qualification`
- Base/main SHA: `cffc12030d345e9b04a63e918bff50c96b608a7b`
- Base post-merge workflow: `35359739796` SUCCESS — Ubuntu + Windows
- Verified harness SHA: `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`
- Harness workflow: `35360017018` SUCCESS — Ubuntu + Windows, 24/24 tests
- Current phase: Basic Provider Chat
- Harness state: VERIFIED
- External live state: NOT_RUN / BLOCKED_EXTERNAL_EXECUTION
- Blocker: current GitHub/chat executor cannot run on the user's Windows host or reach its loopback-compatible endpoint
- Next action: run `npm run qualify:provider` on an authorized host that can reach the real model endpoint and return sanitized JSON evidence
- Router status: GATED
- Background execution: NOT_CONFIGURED
- Checkpoint: [ZOOID-0003 report](../reports/ZOOID-0003-live-provider-qualification-checkpoint.md)

## Session recovery rule

Read `AGENTS.md`, this file, `STATUS.md`, ZOOID-0003 and its checkpoint report.

Do not convert fixture CI into a live-provider PASS. A live PASS requires real model execution and exact marker recovery.

If local execution returns PASS, update ZOOID-0003 and the phase status before starting Router work.
