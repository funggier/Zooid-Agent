# Worklog

## 2026-09-18 — ZOOID-0003 external live gate PASS

Remote Desktop Commander became available and connected to device `CDQ-P`, allowing the previously blocked live gate to execute on the real Windows host.

Host baseline:
- Windows 10 Pro build 19045
- Intel Core Ultra 5 245K, 14C/14T
- 31.46 GB RAM
- Intel Graphics
- Node.js 24.18.0
- Ollama 0.32.15

A clean clone at `T:\Zooid-Agent-livecheck` checked out head `2b9ec0c415aa63dbbd15147289b79dfdefc6260e` and passed all 24 local tests.

First live attempt with existing `qwen3.8:27b` correctly timed out after 180 seconds. A direct 8-token request also timed out after ~30 seconds. Ollama reported the model running 100% CPU, so this was recorded as a host/model performance limitation.

A smaller `qwen3:1.7b` model was then pulled specifically to isolate functional correctness from large-model latency.

The exact same Zooid live qualification passed in ~16.08 seconds:
- outcome PASS
- messageCount 4
- orderedCompleteTranscript true
- markerRecovered true

Basic Provider Chat is now COMPLETE and the Provider Router gate is released after merge.

Detailed evidence: [ZOOID-0003 final report](../reports/ZOOID-0003-live-provider-qualification-report.md).

---

## 2026-09-18 — ZOOID-0003 harness verified; external execution initially blocked

Implemented the two-turn live-provider qualification harness at `7b79e0d427c59d7706213c48fceb8cf65c59d5ef`.

Workflow `35360017018` completed SUCCESS on Ubuntu and Windows with 24/24 tests.

At that time no local execution connector was available, so the task correctly recorded `BLOCKED_EXTERNAL_EXECUTION`. That checkpoint is preserved historically and later superseded by the real host PASS above.

---

## 2026-09-18 — ZOOID-0002 protocol transport verified

ZOOID-0002 added the OpenAI-compatible Chat Completions transport and passed Ubuntu/Windows fixture CI.

---

## 2026-09-18 — ZOOID-0001 basic chat foundation verified

ZOOID-0001 established the Node.js 24 / TypeScript foundation, file-backed sessions, fake provider, ChatService and CLI.
