# ZOOID-0003 — External Live Provider Qualification

## Metadata

- ID: ZOOID-0003
- Status: BLOCKED_EXTERNAL_EXECUTION
- Started: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0003-live-provider-qualification`
- Base/main SHA: `cffc12030d345e9b04a63e918bff50c96b608a7b`
- Base post-merge workflow: `35359739796` — SUCCESS, Ubuntu + Windows
- Last verified harness SHA: `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`
- Harness workflow: `35360017018` — SUCCESS, Ubuntu + Windows, 24/24 tests
- Previous task: [ZOOID-0002](ZOOID-0002-openai-compatible-provider.md)
- Pull request: #3 (DRAFT; do not merge before live PASS)\n- Checkpoint report: [ZOOID-0003 live qualification checkpoint](../reports/ZOOID-0003-live-provider-qualification-checkpoint.md)
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

Fixture success proves the harness, not the external endpoint.

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

Provider settings:

- `ZOOID_PROVIDER=openai-compatible`
- `ZOOID_PROVIDER_BASE_URL`
- `ZOOID_PROVIDER_MODEL`
- `ZOOID_PROVIDER_API_KEY` when required
- `ZOOID_PROVIDER_TIMEOUT_MS` optional

Qualification-only:

- `ZOOID_QUALIFY_KEEP_DATA=1` keeps the generated temporary evidence root
- `ZOOID_QUALIFY_DATA_DIR=<path>` uses an explicit isolated root and does not auto-delete it

## Work slices

### A — Qualification harness
- [x] random-marker two-turn protocol
- [x] transcript/order/status verification
- [x] JSON PASS/FAIL/BLOCKED output
- [x] secret-free output contract
- [x] isolated temporary data root

### B — Deterministic harness tests
- [x] fixture PASS requires history on second request
- [x] fixture semantic FAIL when marker is not recovered
- [x] Ubuntu CI
- [x] Windows CI
- [x] 24/24 tests at workflow `35360017018`

### C — External live gate
- [ ] execute against an authorized real compatible model endpoint
- [ ] record endpoint class/model without secret
- [x] record current state as `BLOCKED_EXTERNAL_EXECUTION`
- [ ] if PASS, close Basic Provider Chat and permit Router task
- [x] while blocked, keep Router gated

## Verified harness behavior

At SHA `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`, workflow `35360017018` passed Ubuntu and Windows.

Observed Ubuntu suite:
- tests: 24
- pass: 24
- fail: 0
- qualification PASS fixture proves the second request receives the first turn history
- qualification semantic FAIL fixture proves missing marker is not accepted

## Blocker

**BLOCKED_EXTERNAL_EXECUTION**

This ChatGPT/GitHub execution context can change and validate repository state, but it cannot execute commands on the user's Windows host or reach that machine's loopback endpoint such as `127.0.0.1:11434`. No authorized external endpoint or credential is available to this session.

Therefore no live model was contacted and Basic Provider Chat remains OPEN.

## Exact local execution handoff

From a Windows PowerShell shell in the repository:

```powershell
git fetch origin
git switch agent/zooid-0003-live-provider-qualification
git pull --ff-only

$env:ZOOID_PROVIDER = "openai-compatible"
$env:ZOOID_PROVIDER_BASE_URL = "http://127.0.0.1:11434/v1"
$env:ZOOID_PROVIDER_MODEL = "<installed-compatible-model>"
Remove-Item Env:ZOOID_PROVIDER_API_KEY -ErrorAction SilentlyContinue
$env:ZOOID_PROVIDER_TIMEOUT_MS = "120000"

npm run qualify:provider
```

If the endpoint requires a token, set it only in the shell:

```powershell
$env:ZOOID_PROVIDER_API_KEY = "<secret>"
npm run qualify:provider
```

To retain the isolated qualification transcript:

```powershell
$env:ZOOID_QUALIFY_KEEP_DATA = "1"
npm run qualify:provider
```

A passing result must contain at least:

```json
{
  "outcome": "PASS",
  "messageCount": 4,
  "orderedCompleteTranscript": true,
  "markerRecovered": true
}
```

Do not substitute a model name that is not actually installed/available. The base URL above is only an example for a local compatible endpoint.

## Next action

Run the exact qualification command from an authorized environment that can reach the real endpoint.

- PASS → record sanitized JSON evidence, close ZOOID-0003, close Basic Provider Chat, then open the next Router task.
- FAIL → retain the live result, diagnose the exact provider/model behavior, keep Router gated.
- endpoint unavailable → retain `BLOCKED_EXTERNAL_EXECUTION`.

Do not merge this task as phase-complete based only on fixture CI.
