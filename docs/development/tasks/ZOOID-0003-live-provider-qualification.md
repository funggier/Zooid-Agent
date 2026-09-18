# ZOOID-0003 — External Live Provider Qualification

## Metadata

- ID: ZOOID-0003
- Status: COMPLETE
- Started: 2026-09-18
- Completed: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0003-live-provider-qualification`
- Base/main SHA: `cffc12030d345e9b04a63e918bff50c96b608a7b`
- Base post-merge workflow: `35359739796` — SUCCESS, Ubuntu + Windows
- Verified harness SHA: `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`
- Harness workflow: `35360017018` — SUCCESS, Ubuntu + Windows, 24/24 tests
- Current branch head before final evidence commit: `2b9ec0c415aa63dbbd15147289b79dfdefc6260e`
- Pull request: #3
- Historical blocked checkpoint: [ZOOID-0003 live qualification checkpoint](../reports/ZOOID-0003-live-provider-qualification-checkpoint.md)
- Final report: [ZOOID-0003 live provider qualification report](../reports/ZOOID-0003-live-provider-qualification-report.md)
- Phase: Basic Provider Chat

## Why this task existed

ZOOID-0002 proved the OpenAI-compatible HTTP boundary only with deterministic loopback fixtures. ZOOID-0003 existed to prove the same path against a real model endpoint and verify actual multi-turn session history.

A mere HTTP 200 was explicitly insufficient. The live gate required a real model to recover an exact random marker from the previous turn using Zooid's persisted session.

## Acceptance

The live gate required:

- a real compatible endpoint;
- turn 1 assistant response;
- turn 2 exact marker recovery from the previous turn;
- exactly four ordered complete persisted messages;
- no provider secret in output;
- reproducible endpoint/model/runtime evidence.

## Implementation

The task added:

- `npm run qualify:provider`;
- random marker generation;
- isolated qualification session storage;
- exact transcript/order/status verification;
- machine-readable PASS/FAIL/BLOCKED output;
- deterministic PASS fixture that proves second HTTP request receives prior history;
- semantic FAIL fixture when marker recovery does not occur.

## Deterministic verification

At SHA `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`:

- workflow `35360017018`: SUCCESS
- Ubuntu: PASS
- Windows: PASS
- tests: 24
- pass: 24
- fail: 0

PR/checkpoint heads also passed subsequent Ubuntu/Windows workflows.

## Real host qualification

Authorized host: `CDQ-P`

Runtime:
- Windows 10 Pro 22H2 / build 19045
- Node.js `v24.18.0`
- npm `11.16.0`
- Ollama `0.32.15`
- endpoint `http://127.0.0.1:11434/v1`
- provider kind `openai-compatible`

### Large-model observation

Existing model `qwen3.8:27b` was attempted first.

Observed:
- Ollama reported model size ~18 GB;
- processor: 100% CPU;
- context: 32768;
- Zooid live qualification turn 1 timed out after 180000 ms;
- transcript correctly preserved the user message as `failed`;
- no assistant message was fabricated;
- a direct 8-token OpenAI-compatible request also timed out after ~30 seconds.

Interpretation: this is a host/model responsiveness limitation under the observed CPU-only execution state, not evidence of a Zooid transport failure.

### Functional live PASS

A smaller local model `qwen3:1.7b` was installed specifically to separate functional correctness from large-model performance.

Observed real qualification result:

```json
{
  "outcome": "PASS",
  "provider": "openai-compatible",
  "model": "qwen3:1.7b",
  "baseUrl": "http://127.0.0.1:11434/v1",
  "messageCount": 4,
  "orderedCompleteTranscript": true,
  "markerRecovered": true,
  "firstResponseLength": 76,
  "secondResponseLength": 42
}
```

Runtime: approximately 16.08 seconds end-to-end for the two-turn qualification.

The exact random marker and session ID were observed locally but are not required for long-term project state; the invariant is exact marker recovery with the same persisted session.

## Host capability observation

Snapshot from `CDQ-P`:

- CPU: Intel Core Ultra 5 245K
- cores/logical processors: 14 / 14
- reported max clock: 4200 MHz
- RAM: 31.46 GB total
- free RAM at snapshot: 14.32 GB
- graphics: Intel Graphics plus Parsec Virtual Display Adapter
- Ollama large model observation: `qwen3.8:27b` running 100% CPU
- C: 465.1 GB volume, ~17.3 GB free after qualification model install
- T: 931.5 GB volume, ~643.1 GB free
- multiple additional ~1 TB data volumes are present

Practical consequence for Zooid architecture: one-small-model operation is realistic on this host, while large 27B local models can have very high latency when CPU-only. Scheduler/context design should therefore remain conservative and must not assume fast parallel inference.

## Result

**PASS**

- harness: VERIFIED
- real compatible endpoint: VERIFIED
- real model multi-turn history: VERIFIED
- exact marker recovery: VERIFIED
- persisted ordered transcript: VERIFIED
- Basic Provider Chat: COMPLETE
- Provider Router gate: RELEASED

## Next action

Merge PR #3 after final CI is green. Then create the next numbered task for Provider Routing from the verified post-merge `main` baseline.
