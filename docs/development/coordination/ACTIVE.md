# Active Work

- State: READY_FOR_NEXT_TASK
- Active development task: NONE
- Last completed task: [ZOOID-0002 — OpenAI-Compatible Provider Adapter](../tasks/ZOOID-0002-openai-compatible-provider.md)
- Next task sequence: ZOOID-0003
- Completed branch: `agent/zooid-0002-openai-compatible-provider`
- Base/main SHA: `a477fe7abedee21e03f171e249c5c8bdac7cdecb`
- Last verified implementation SHA: `26f5da9924892826bbcbe968f28cea72e639f889`
- Verified workflow: `35359099312` SUCCESS — Ubuntu + Windows, 22/22 tests
- Current phase: Basic Provider Chat
- External live smoke: NOT_RUN
- Next action: merge ZOOID-0002 through PR, then create ZOOID-0003 for authorized external compatible endpoint multi-turn qualification
- Remaining gate: real model endpoint qualification; Router must not start before it passes
- Background execution: NOT_CONFIGURED

## Session recovery rule

A new session should read `AGENTS.md`, this file, `STATUS.md`, the latest numbered task and report.

The Git branch/ref is authoritative for current HEAD. Documents record the last verified implementation SHA because a document cannot reliably contain the SHA of the commit that contains itself.

If no real endpoint is reachable in ZOOID-0003, record BLOCKED with the exact missing dependency rather than marking Basic Provider Chat complete.
