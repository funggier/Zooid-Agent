# ZOOID-0003 — External Live Provider Qualification

## Metadata

- ID: ZOOID-0003
- Status: IN_PROGRESS
- Started: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0003-live-provider-qualification`
- Base/main SHA: `cffc12030d345e9b04a63e918bff50c96b608a7b`
- Base post-merge workflow: `35359739796` — SUCCESS, Ubuntu + Windows
- Previous task: [ZOOID-0002](ZOOID-0002-openai-compatible-provider.md)
- Phase: Basic Provider Chat

## Why this task exists

ZOOID-0002 proved the HTTP protocol boundary only with deterministic loopback fixtures. The remaining Basic Provider Chat gate is evidence from a real compatible model endpoint.

A mere HTTP 200 is not sufficient. The live gate must prove that Zooid can maintain a real two-turn conversation using its persisted session history.

## Goal

Provide and execute a repeatable live qualification that:

1. requires explicit `openai-compatible` provider configuration;
2. uses an isolated session root rather than normal user history;
3. sends a random marker on turn 1;
4. asks the same model to recover that marker on turn 2;
5. verifies the persisted transcript is exactly four ordered complete messages;
6. emits machine-readable PASS/FAIL/BLOCKED output;
7. never prints or persists the configured API key;
8. preserves optional evidence data only when explicitly requested.

## Acceptance

A live run passes only when:

- a real authorized compatible endpoint is reached;
- turn 1 returns a non-error assistant response;
- turn 2 returns the exact random marker from turn 1;
- the persisted session contains user/assistant/user/assistant in order;
- no provider secret appears in output;
- endpoint/model and timestamp can be recorded without secret disclosure.

If the executing environment cannot reach an authorized real endpoint, record `BLOCKED_EXTERNAL_EXECUTION` rather than treating deterministic fixture success as live qualification.

## Scope

In scope:
- reusable qualification runner
- CLI command `npm run qualify:provider`
- machine-readable result
- fixture tests for PASS and semantic FAIL
- isolated temporary storage
- optional kept evidence root
- external live execution when reachable
- final Basic Provider Chat phase decision

Out of scope:
- Router/fallback
- provider benchmarking/ranking
- streaming/tool calls
- installing Ollama or provisioning external credentials
- committing credentials
- treating a GitHub fixture as a live model

## Configuration

Use the same provider settings as ZOOID-0002:

- `ZOOID_PROVIDER=openai-compatible`
- `ZOOID_PROVIDER_BASE_URL`
- `ZOOID_PROVIDER_MODEL`
- `ZOOID_PROVIDER_API_KEY` when required
- `ZOOID_PROVIDER_TIMEOUT_MS` optional

Qualification-only settings:

- `ZOOID_QUALIFY_KEEP_DATA=1` keeps the generated temporary evidence root
- `ZOOID_QUALIFY_DATA_DIR=<path>` uses an explicit isolated root and does not auto-delete it

## Work slices

### A — Qualification harness
- [x] random-marker two-turn protocol
- [x] transcript/order/status verification
- [x] JSON PASS/FAIL output
- [x] secret-free output contract
- [x] isolated temporary data root

### B — Deterministic harness tests
- [x] fixture PASS requires history on second request
- [x] fixture semantic FAIL when marker is not recovered
- [ ] Ubuntu CI
- [ ] Windows CI

### C — External live gate
- [ ] execute against an authorized real compatible model endpoint
- [ ] record endpoint class/model without secret
- [ ] record PASS/FAIL/BLOCKED
- [ ] if PASS, close Basic Provider Chat and permit ZOOID-0004 Router work
- [ ] if BLOCKED, keep Router gated

## Progress

### 2026-09-18 — Task opened

- ZOOID-0002 merged to main at `cffc12030d345e9b04a63e918bff50c96b608a7b`.
- Post-merge workflow `35359739796` passed Ubuntu and Windows.
- Created branch `agent/zooid-0003-live-provider-qualification`.
- Implemented qualification harness and deterministic fixture coverage.

## Next action

Run CI for the qualification harness. After deterministic GREEN, attempt the external live run only from an environment that can reach the configured authorized endpoint. If no such endpoint is reachable from this execution context, persist the blocked boundary with the exact local command needed for handoff.
