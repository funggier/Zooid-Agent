# ZOOID-0003 — Live Provider Qualification Checkpoint

## Result

**HARNESS: VERIFIED**

**EXTERNAL_LIVE: BLOCKED_EXTERNAL_EXECUTION**

The live-qualification mechanism is implemented and cross-platform verified. A real model endpoint has not been contacted from this execution context.

## Verified source

- Branch: `agent/zooid-0003-live-provider-qualification`
- Base/main: `cffc12030d345e9b04a63e918bff50c96b608a7b`
- Verified harness SHA: `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`
- Workflow: `35360017018`
- Result: SUCCESS on Ubuntu + Windows
- Tests: 24 passed / 0 failed

## What the harness proves

The qualification runner:

1. creates an isolated Zooid session;
2. generates a random `ZOOID-<uuid>` marker;
3. sends the marker in turn 1;
4. sends turn 2 using the same persisted session;
5. requires the second assistant reply to contain the exact marker;
6. reopens the session and requires exactly four complete ordered messages;
7. returns machine-readable JSON;
8. removes temporary evidence data by default;
9. never includes the API-key value in its result schema.

The deterministic PASS fixture additionally inspects the second HTTP request and requires the message roles to be:

`user -> assistant -> user`

This proves the history path is exercised, rather than the fixture returning a marker without receiving earlier context.

## Semantic failure behavior

A fixture that returns a normal assistant response but does not recover the marker produces:

- `outcome: FAIL`
- `markerRecovered: false`

Thus HTTP success alone does not pass the qualification.

## CLI

Command:

`npm run qualify:provider`

Exit behavior:

- PASS → exit 0
- provider configuration missing/invalid → BLOCKED, exit 2
- semantic qualification failure → exit 3
- normalized provider error → exit 4
- unexpected runtime failure → exit 1

## External blocker

The current execution environment has GitHub repository access but no execution channel to the user's Windows host and cannot reach host-local loopback services such as `127.0.0.1:11434`.

No authorized remote compatible endpoint/credential was supplied to this execution session.

Accordingly:

- real endpoint contacted: NO
- real model response observed: NO
- live multi-turn marker recovery: NOT_RUN
- Basic Provider Chat phase: OPEN
- Router: GATED

## Windows handoff

From the repository checkout:

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

If authentication is required, set `ZOOID_PROVIDER_API_KEY` only in the process environment. Do not write it into a task/report.

Expected passing fields:

- `"outcome": "PASS"`
- `"messageCount": 4`
- `"orderedCompleteTranscript": true`
- `"markerRecovered": true`

The endpoint/model names may be recorded. Secret values must not be recorded.

## Next evidence required

A sanitized result from an authorized real endpoint. Once observed, append the exact endpoint class/model, date, command context and PASS/FAIL outcome to ZOOID-0003 before changing the phase gate.
