# Active Work

- State: RUNNING
- Active development task: [ZOOID-0001 — Basic Chat Foundation](../tasks/ZOOID-0001-basic-chat-foundation.md)
- Task ID: ZOOID-0001
- Owner: ChatGPT GitHub development session
- Branch: `agent/zooid-0001-basic-chat-foundation`
- Base SHA: `ecf1d582d09d9bc1798ad25c643e40f067c6bb23`
- Last recorded branch HEAD: `b2b1033026a3a148865d0c722d5c7cf5c578dc02`
- Current phase: Basic Provider Chat
- Last checkpoint: numbered GitHub development task ledger established and ZOOID-0001 opened
- Next action: create runnable TypeScript/Node scaffold, fake provider, session persistence, tests and GitHub Actions
- Remaining risks: live provider not yet selected/qualified; Windows runtime qualification remains open
- Evidence: [ZOOID-0001](../tasks/ZOOID-0001-basic-chat-foundation.md)
- Background execution: NOT_CONFIGURED

## Session recovery rule

A new session should read `AGENTS.md`, this file, `STATUS.md`, then the active numbered task. The numbered task is the durable source for why the work exists, what changed, evidence, blockers and exact next action.

Do not start an unnumbered implementation task. When ZOOID-0001 finishes, create the next sequential task before expanding into the next scope.
