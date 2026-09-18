# Active Work

- State: READY_FOR_NEXT_TASK
- Last completed task: [ZOOID-0001 — Basic Chat Foundation](../tasks/ZOOID-0001-basic-chat-foundation.md)
- Active development task: NONE
- Next task sequence: ZOOID-0002
- Completed branch: `agent/zooid-0001-basic-chat-foundation`
- Base SHA: `ecf1d582d09d9bc1798ad25c643e40f067c6bb23`
- Last verified implementation SHA: `0da31b465846823cb09b8b64bfa48ca5879e0c58`
- Current phase: Basic Provider Chat
- Last checkpoint: runnable fake-provider chat foundation verified on Ubuntu + Windows
- Next action: merge ZOOID-0001 through reviewable PR, then open ZOOID-0002 for first real provider configuration/adapter qualification
- Remaining risks: live provider not yet selected/qualified; user-machine Windows qualification remains open
- Evidence: [ZOOID-0001 report](../reports/ZOOID-0001-basic-chat-foundation-report.md)
- Background execution: NOT_CONFIGURED

## Session recovery rule

A new session should read `AGENTS.md`, this file, `STATUS.md`, then the latest numbered task/report.

The Git branch/ref is authoritative for the current HEAD. Documents record the last verified implementation SHA; they do not attempt to contain the SHA of the commit that contains themselves.

Do not start an unnumbered implementation task. Create ZOOID-0002 before beginning the next implementation scope.
