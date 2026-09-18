# ZOOID-0003 — Live Provider Qualification Report

## Result

**PASS**

ZOOID-0003 successfully proved Zooid's Basic Provider Chat path against a real local model endpoint.

## Repository evidence

- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0003-live-provider-qualification`
- Base/main: `cffc12030d345e9b04a63e918bff50c96b608a7b`
- Verified harness SHA: `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`
- Harness workflow: `35360017018` — SUCCESS on Ubuntu + Windows
- Harness tests: 24 passed / 0 failed
- PR: #3

## Real execution environment

Device:
- name: `CDQ-P`
- OS: Microsoft Windows 10 Pro
- version/build: `10.0.19045` / `19045`
- architecture: 64-bit

Runtime:
- PowerShell: `5.1.19041.6456`
- Git: `2.55.0.windows.3`
- Node.js: `v24.18.0`
- npm: `11.16.0`
- Ollama: `0.32.15`

Endpoint:
- protocol: OpenAI-compatible Chat Completions
- base URL: `http://127.0.0.1:11434/v1`
- authentication: none
- no secret was written to repository evidence

## Host hardware observation

CPU:
- Intel Core Ultra 5 245K
- 14 cores
- 14 logical processors
- reported max clock 4200 MHz

Memory:
- total visible RAM: 31.46 GB
- free RAM at snapshot: 14.32 GB

Graphics:
- Intel Graphics
- Parsec Virtual Display Adapter
- Ollama reported the active 27B model as 100% CPU

Storage snapshot:
- C: ~465.1 GB total, ~17.3 GB free after small-model installation
- T: ~931.5 GB total, ~643.1 GB free
- additional ~1 TB E/G/N volumes present

## Local repository verification

A clean single-branch clone was created at:

`T:\Zooid-Agent-livecheck`

Exact checked-out head before final evidence commit:

`2b9ec0c415aa63dbbd15147289b79dfdefc6260e`

Local regression run:

- tests: 24
- pass: 24
- fail: 0
- duration: ~344 ms

## Large-model qualification attempt

Model:
`qwen3.8:27b`

Ollama observation:
- model footprint reported ~18 GB
- processor: 100% CPU
- context: 32768

Zooid qualification result:

```json
{
  "outcome": "FAIL",
  "kind": "timeout",
  "message": "Provider request timed out after 180000 ms."
}
```

Persisted session behavior after timeout:
- one user message preserved;
- message status: `failed`;
- no assistant response appended.

A separate direct OpenAI-compatible request with a trivial prompt and `max_tokens=8` also timed out after approximately 30 seconds.

This supports the conclusion that the observed failure was large-model responsiveness on the host, not a Zooid session/transport defect.

## Functional qualification model

To isolate correctness from large-model latency, `qwen3:1.7b` was pulled through Ollama.

Approximate model download:
- 1.4 GB

## Real live PASS

Command path:

`npm run qualify:provider`

Observed sanitized result:

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

Process exit:
- code: 0
- runtime: 16.08 seconds

The runner used a random marker on turn 1 and required exact recovery on turn 2 using the same Zooid persisted session.

## Acceptance evaluation

- real endpoint reached: PASS
- real model response observed: PASS
- two-turn session history used: PASS
- exact random marker recovered: PASS
- four ordered complete persisted messages: PASS
- secret-free result: PASS
- deterministic cross-platform harness CI: PASS

## Architectural consequence

Basic Provider Chat is now qualified and may be closed.

Provider Routing is no longer blocked by the live-chat gate.

The host evidence also reinforces an existing project invariant: Zooid must remain viable with one small model. On this machine, a 1.7B model passed the functional live gate comfortably while a 27B CPU-only model was not responsive enough for the same gate.

## Final status

**ZOOID-0003 COMPLETE**

Next: merge PR #3, verify post-merge CI on `main`, then open the next numbered Provider Routing task.
