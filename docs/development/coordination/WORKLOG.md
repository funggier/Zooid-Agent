# Worklog

## 2026-09-18 — ZOOID-0004 Registry and Router foundation GREEN

Work Package A:
- SHA `0c49d9d58b8c386209b461de6a64dbc7ac408e54`
- workflow `35365344223`
- SUCCESS Ubuntu + Windows
- 29/29 tests

Work Package B used an explicit GitHub-runner RED → GREEN cycle:
- RED SHA `dd61bec6b8f5efbf181763fac81a687ccee2cbdb`
- workflow `35365567556`
- expected failure because `src/providers/router.ts` did not yet exist
- 29 existing tests passed, 1 new router test file failed
- minimal implementation SHA `823d3ff9b5670729f5391a4d4c2f1774036847c3`
- workflow `35365663955`
- SUCCESS Ubuntu + Windows
- 33/33 tests

Router now produces deterministic explicit route snapshots, performs capability rejection before dispatch, and never silently falls back to another registered provider.

Local host note: Windows commit charge was observed at ~51.33/51.46 GB with a fixed 20 GB pagefile effectively full. Local Node test workers could fail to allocate threads/heap under this pressure. No pagefile or unrelated process/model settings were changed; clean CI remains the verification authority for this milestone.

Next: same-session route switching and provider/model attribution.

---


## 2026-09-18 — Single slow-model baseline clarified

The user explicitly required Zooid to remain usable with `qwen3.8:27b` as the only model even when inference is very slow.

This changes the interpretation of the ZOOID-0003 27B timeout: the 180-second result is a performance observation under that qualification window, not a reason to require a smaller helper model.

Architecture constraints carried forward into ZOOID-0004:
- single-model serial operation is mandatory;
- `qwen3.8:27b`-only mode is supported by design;
- helper/small models are optional optimizations;
- no router/controller dependency on parallel inference;
- provider timeout must be configurable;
- slow inference alone is not failure;
- control-plane logic should stay deterministic and avoid unnecessary LLM calls.

---


## 2026-09-18 — ZOOID-0004 Provider Routing opened

ZOOID-0003 merged through PR #3 to main commit `f129f99fe6b3f25b3e9a22f26715b0d9a0051ffd`.

Post-merge workflow `35362601729` completed SUCCESS on Ubuntu and Windows.

Opened branch `agent/zooid-0004-provider-routing`.

Read the existing Provider Routing phase plan, system overview, requirements, design decisions and quality gates before setting scope.

The first slice is deterministic provider capability + registry validation. Manual switching remains the baseline; automatic fallback/load balancing/cost routing are deferred.

Real host evidence from ZOOID-0003 is carried forward as a constraint: `qwen3:1.7b` passed the live gate while `qwen3.8:27b` was not responsive enough under observed CPU-only execution. Router correctness must therefore remain cheap, serial and independent of parallel real-model inference.

---

## 2026-09-18 — ZOOID-0003 external live gate PASS

Remote Desktop Commander enabled execution on device `CDQ-P`. The real OpenAI-compatible Ollama path passed with `qwen3:1.7b`; detailed evidence remains in the ZOOID-0003 final report.

---

## 2026-09-18 — ZOOID-0002 protocol transport verified

ZOOID-0002 added the OpenAI-compatible Chat Completions transport and passed Ubuntu/Windows fixture CI.

---

## 2026-09-18 — ZOOID-0001 basic chat foundation verified

ZOOID-0001 established the Node.js 24 / TypeScript foundation, file-backed sessions, fake provider, ChatService and CLI.
