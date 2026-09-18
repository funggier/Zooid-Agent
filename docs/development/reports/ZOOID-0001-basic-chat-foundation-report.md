# ZOOID-0001 — Basic Chat Foundation Report

## Result

**PASS — foundation scope complete**

Zooid now has a runnable, deterministic basic-chat foundation on Node.js 24 with no runtime dependencies. The verified implementation supports a CLI, ordered file-backed sessions, a provider contract, fake provider, normalized failures, cancellation and a cross-platform CI suite.

This report does **not** claim live-provider qualification or completion of the full Basic Provider Chat phase.

## Verified source

- Branch: `agent/zooid-0001-basic-chat-foundation`
- Base: `ecf1d582d09d9bc1798ad25c643e40f067c6bb23`
- Verified implementation SHA: `0da31b465846823cb09b8b64bfa48ca5879e0c58`
- Final source-verification workflow: `35357816628`
- Runner runtime observed: Node.js `v24.20.0`

## Implementation inventory

### Runtime/scaffold

- `package.json`
- `tsconfig.json`
- `.gitignore`
- `.github/workflows/foundation.yml`

The runtime uses Node 24 native TypeScript type stripping. There are no runtime npm dependencies at this checkpoint.

### Domain and persistence

- `src/domain/messages.ts`
- `src/storage/file-session-store.ts`

Messages carry stable IDs, session ID, monotonic sequence, role, text, status and timestamp. Sessions are written using temporary-file + rename. Corrupt files are reported and preserved instead of silently overwritten.

### Provider boundary

- `src/providers/contracts.ts`
- `src/providers/fake-provider.ts`

The provider boundary separates ChatRequest/ChatResult from the CLI. Provider errors are normalized into explicit kinds. The fake provider supplies deterministic success, error, delay and cancellation paths without credentials.

### Chat service

- `src/chat/chat-service.ts`

The user message is persisted before provider dispatch. Success marks the user message complete and appends exactly one assistant message. Cancellation marks the user message interrupted; provider failure marks it failed. A post-provider abort check prevents a late result from becoming an unexpected assistant reply.

### CLI

- `src/cli/chat.ts`

The CLI supports a new session, opening an existing session, text submission and exit. Interactive SIGINT aborts an active provider request. Input initialization was deliberately moved after asynchronous session creation after CI exposed an early-piped-input race.

### Tests

- `tests/file-session-store.test.ts`
- `tests/chat-service.test.ts`
- `tests/fake-provider.test.ts`
- `tests/cli-smoke.test.ts`

Coverage includes Thai/multiline input, persistence reopen, corrupt file preservation, provider success/error/cancel, cancellation without late reply and full CLI smoke flow.

## CI evidence and failure history

### Run 35357207396 — SUCCESS

Initial foundation passed 7 tests on Ubuntu and Windows.

### Run 35357355471 — FAILURE

Adding CLI smoke exposed `ERR_USE_AFTER_CLOSE` in the readline question loop under piped EOF.

### Run 35357456649 — FAILURE

After switching to async line iteration, immediate piped command batching caused unsettled top-level await / exit code 13.

### Run 35357580182 — FAILURE

Staging exit after provider output timed out. This isolated the remaining root cause: readline had been created before async session initialization and could consume an early line before the async iterator was attached.

### Run 35357816628 — SUCCESS

The CLI now initializes the session first, then attaches readline; the smoke harness waits for readiness before sending text. Ubuntu and Windows both passed the complete suite, including the CLI path.

The failed runs are retained as evidence because they explain why the final lifecycle contract exists.

## Data and cleanup behavior

Default development data root:

`.zooid-data/`

Override:

`ZOOID_DATA_DIR=<disposable-root>`

Tests always use disposable temporary roots and remove them after execution. Secrets are neither required nor stored for the fake-provider path.

## Limitations / non-claims

- Live provider: NOT_TESTED
- Provider credentials/configuration: NOT_IMPLEMENTED
- Router: NOT_STARTED
- Ticket engine: NOT_STARTED
- Recovery: NOT_STARTED
- Project/Group: NOT_STARTED
- Installer/updater: NOT_STARTED
- User-machine Windows qualification: NOT_RUN

## Decision consequence

Node.js 24 + TypeScript is accepted as the current application foundation. Replacing the stack now requires concrete evidence that this baseline cannot meet a later contract; future complexity alone is not a reason to rewrite it.

## Handoff

The next worker should read:

1. `AGENTS.md`
2. `docs/development/coordination/ACTIVE.md`
3. `docs/development/coordination/STATUS.md`
4. this report
5. the next numbered task once opened

Next technical boundary: first real provider configuration and adapter qualification, still within Basic Provider Chat.
