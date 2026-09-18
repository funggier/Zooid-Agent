# ZOOID-0001 — Basic Chat Foundation

## Metadata

- ID: ZOOID-0001
- Status: COMPLETE
- Started: 2026-09-18
- Completed: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0001-basic-chat-foundation`
- Base SHA: `ecf1d582d09d9bc1798ad25c643e40f067c6bb23`
- Verified implementation SHA: `0da31b465846823cb09b8b64bfa48ca5879e0c58`
- Phase: Basic Provider Chat
- Report: [basic chat foundation report](../reports/ZOOID-0001-basic-chat-foundation-report.md)
- Previous planning input: [prepare-basic-chat](prepare-basic-chat.md)

## Why this task existed

Zooid มี architecture/roadmap แล้วแต่ยังไม่มี application code งานนี้เปลี่ยน repository จาก planning-only state ให้มี executable path ที่เล็กและตรวจสอบได้:

`user input -> chat service -> provider contract -> response -> persisted session`

การเริ่มจากเส้นทางนี้แยกปัญหา runtime, session persistence, cancellation และ provider boundary ออกจาก Router, Ticket, Recovery, Project และ Group

งานนี้ยังสร้าง durable GitHub task history ตามคำสั่งผู้ใช้ เพื่อให้ session ใหม่รับช่วงงานจาก repository โดยไม่ต้องพึ่งประวัติแชต

## Goal result

ทำสำเร็จสำหรับ foundation:

1. รันจาก checkout ด้วย Node.js 24+ โดยไม่มี runtime dependency ภายนอก
2. มี CLI chat ขั้นพื้นฐาน
3. มี provider interface และ deterministic fake provider
4. เก็บ ordered session/message และ reopen ได้
5. มี cancel/error provenance และป้องกัน late assistant response
6. มี automated tests + CLI smoke test
7. CI ผ่านทั้ง Ubuntu และ Windows
8. มี task/report/coordination history สำหรับ handoff

## Implemented scope

- [x] `package.json`, TypeScript config และ source/test layout
- [x] Node 24 native TypeScript execution; no runtime package install required
- [x] message/session contracts และ stable UUIDs
- [x] ordered transcript model
- [x] atomic file-backed session persistence
- [x] corrupt-session preservation/error path
- [x] provider request/result/error contracts
- [x] deterministic fake provider
- [x] cancellation behavior และ late-response guard
- [x] CLI: new/open session, send text, exit, normalized error display
- [x] interactive Ctrl+C request cancellation path
- [x] Thai/multiline coverage
- [x] persistence reopen coverage
- [x] CLI end-to-end smoke path
- [x] GitHub Actions matrix on Ubuntu + Windows
- [x] README setup/test/run instructions
- [x] durable task/report/checkpoint

## Explicitly not included

- live provider credentials or live provider qualification
- multi-provider routing
- durable Ticket engine
- recovery orchestration
- Project/Group runtime
- background autonomous loop
- tool/skill ecosystem
- installer/updater
- SQLite migration

A raw malformed HTTP/provider payload fixture is deferred to the first real transport adapter. The fake provider is an in-process typed boundary, so fabricating wire corruption inside it would not test the behavior that matters. Error/cancel behavior at the current boundary is covered.

## Verified technical decision

TypeScript + Node.js 24 is accepted for the foundation because the same source and tests execute on GitHub Ubuntu and Windows runners with no runtime dependencies. This is not yet a claim that packaging, native integrations, or the user's live Windows machine are qualified.

## Implementation chronology

### Task opened

- Created branch `agent/zooid-0001-basic-chat-foundation`
- Established numbered task ledger
- Updated coordination state from planning-only to implementation

### Runnable foundation

Commit `5a1d07edc225ed6a8a2e96122c416b8bf670bbca` added domain, storage, provider boundary, fake provider, chat service, CLI, tests and CI.

Workflow run `35357207396` passed Ubuntu and Windows with 7/7 tests.

### CLI smoke gate exposed an input lifecycle bug

Commit `670dc41c18c589f21c14e223fecf49dc8f7b1ea2` added an end-to-end CLI smoke test.

Workflow run `35357355471` failed on both OSes with `ERR_USE_AFTER_CLOSE` because `readline.question()` did not safely handle piped EOF.

Commit `cc8226177abea63be0428574c91ad9bce2116ebd` moved the CLI to async line iteration.

Workflow run `35357456649` still failed with exit code 13 / unsettled top-level await. The test sent multiple commands and EOF while a provider request was still being processed.

Commit `5674eb975b712b6e2dd890966143ba1059639b54` staged smoke input around the provider response. Workflow run `35357580182` then timed out, revealing the deeper race: readline was created before asynchronous session initialization, so early piped input could be consumed before the async iterator attached.

### Root-cause repair

Commit `0da31b465846823cb09b8b64bfa48ca5879e0c58` creates readline only after session initialization and makes the smoke test wait for the CLI readiness banner before sending input.

Workflow run `35357816628` completed SUCCESS on Ubuntu and Windows.

## Acceptance evidence

| Gate | Result |
| --- | --- |
| clean runtime dependency surface | PASS — Node 24+, zero runtime dependencies |
| ordered history/reopen | PASS |
| Thai/multiline message | PASS |
| fake provider success | PASS |
| provider error provenance | PASS |
| cancellation | PASS |
| no late assistant response | PASS |
| corrupt session preservation | PASS |
| CLI input → provider → output | PASS |
| Ubuntu CI | PASS |
| Windows CI | PASS |
| final verified workflow | `35357816628` SUCCESS |

The final verified source SHA is `0da31b465846823cb09b8b64bfa48ca5879e0c58`. Documentation closure commits occur after that source verification; a handoff session must read the live Git branch/ref rather than expecting a document to contain its own commit SHA.

## Remaining limitations

- Current CLI uses the fake provider only.
- No live provider protocol or credential has been selected/qualified.
- GitHub Windows runner is evidence for Windows CI portability, not qualification of the user's physical machine.
- File persistence is a foundation mechanism, not the final durable Ticket/Project datastore.
- GitHub Actions emits an upstream warning that checkout/setup-node v4 target an older action runtime internally; this did not fail Zooid tests.

## Next action

Open the next sequential task for first real provider configuration/adapter qualification. Keep it inside Basic Provider Chat; do not begin Router until one-provider chat is proven end-to-end.
