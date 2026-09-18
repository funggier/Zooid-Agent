# Worklog

## 2026-09-19 — ZOOID-0005 Work Package C catalog runtime GREEN

RED:
- `5e7d3bfb97a5899c4ea1e8d4eedf122b08e87ae7`
- workflow `35376392829`
- 56 existing tests passed; new runtime suite failed because implementation did not yet exist.

GREEN:
- `981d1284bb28b4a99d5145f75af70a0601a30ac2`
- workflow `35376510252`
- SUCCESS Ubuntu + Windows
- 62/62 tests

Verified enabled-only Registry construction, adapter factory separation, credential resolver boundary, all-or-nothing Registry reload, legacy environment compatibility and in-flight route preservation across catalog reload.

Next: read-only discovery and Ollama inventory.

---


## 2026-09-19 — ZOOID-0005 Work Package B configuration service GREEN

RED:
- `ac6a4ee6039558588c7db6951dd32da468143938`
- workflow `35376019986`
- 48 existing tests passed; new configuration-service suite failed because implementation did not yet exist.

GREEN:
- `4b8e5f234baa82c27d9c3e608612a7c24422ee86`
- workflow `35376109866`
- SUCCESS Ubuntu + Windows
- 56/56 tests

Verified reversible provider/model policy mutation, explicit duplicate/not-found errors, provider-removal history preservation, serialized concurrent writes and qwen3.8:27b-only catalog validity.

Next: catalog-backed runtime/Registry reload.

---


## 2026-09-19 — ZOOID-0005 Work Package A catalog GREEN

RED:
- `b583b83c81f005a2446f8bd5bb2095c852ac3b2e`
- workflow `35375708930`
- 40 existing tests passed; new catalog suite failed because implementation modules did not yet exist.

GREEN:
- `1a35200f24b5b08c9b1da07f399b2c68c7da35f3`
- workflow `35375804129`
- SUCCESS Ubuntu + Windows
- 48/48 tests

Implemented versioned strict ProviderCatalog and atomic file store with empty-on-missing, corrupt preservation, adapter/model validation, endpoint credential rejection and credential-reference-only persistence.

Next: Provider Configuration Service mutations.

---


## 2026-09-19 — ZOOID-0005 Provider Configuration/Discovery opened

PR #4 merged to `main` with actual merge SHA `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`.

Verification:
- closure push workflow `35375253456`: SUCCESS Ubuntu + Windows
- PR workflow `35375258060`: SUCCESS Ubuntu + Windows
- post-merge workflow `35375409259`: SUCCESS Ubuntu + Windows

Created branch `agent/zooid-0005-provider-configuration-discovery` from that exact verified baseline.

ZOOID-0005 owns the user-approved provider management design:
- Adapter ≠ Provider Instance ≠ Model
- existing-protocol provider/model changes are configuration operations
- desired enabled/disabled policy is distinct from observed available/unavailable/unknown state
- discovery is read-only and cannot auto-enable
- removal does not erase historical attribution
- catalog stores credential references only, never raw secrets
- one Provider Configuration Service serves CLI now and future UI/API later

First implementation slice: versioned atomic file-backed catalog, no network/model inference.

---


## 2026-09-19 — ZOOID-0004 real routed CLI PASS and closure

A clean clone of `agent/zooid-0004-provider-routing` at head `8aab78abaf070e3a605a7304aad63033ff8e975e` was executed on authorized Windows host `CDQ-P`.

Production path:
`CLI → ProviderRegistry → ProviderRouter → routed ChatService → OpenAI-compatible adapter → local Ollama`.

Model: `qwen3:1.7b`.

Observed PASS:
- `/route` reported `openai-compatible/qwen3:1.7b`;
- real response included exact token `ROUTED_OK`;
- exit code 0;
- two complete persisted messages;
- identical route ID on user/assistant pair;
- provider response ID persisted.

Evidence root: `T:\\Zooid-Agent-routing-evidence\\20260919T003339`.

Host remained under high Windows commit pressure (~50.79/51.46 GB, fixed pagefile effectively full). Both 1.7B and 27B models were already resident; no unrelated model/process was stopped or modified.

The dedicated `qwen3.8:27b` extended-wait acceptance remains required later. ZOOID-0004 does not treat the older 180-second timeout as unsupported-model evidence.

Draft PR #4 opened. Provider Configuration/Discovery moves to ZOOID-0005 after merge.

---


## 2026-09-18 — ZOOID-0004 same-session routing and CLI GREEN

Work Package C1 RED → GREEN:
- RED `aff7f8bca16f64fa292aa64e94dbb6bffb3f15b5`, workflow `35374402511`
- GREEN `42c362929fd9c0b842d250502bb004aa5728ba5e`, workflow `35374568973`
- SUCCESS Ubuntu + Windows, 38/38 tests

Verified route snapshot persistence before dispatch, A → B → A one-session switching, neutral history transfer, in-flight attribution stability, no silent fallback and pre-dispatch incompatibility rejection.

Work Package C2 RED → GREEN:
- RED `dbbb126a775da74f265037714af6e161a74bf548`, workflow `35374705926`
- GREEN `8b3926b2406695ad1475ffc1f80a3c0b04d23bd1`, workflow `35374806274`
- SUCCESS Ubuntu + Windows, 40/40 tests

CLI now runs through Registry → Router → ChatService and supports explicit `/route` inspection/selection.

Next acceptance: real local Ollama through the routed CLI path using the small model for fast feedback.

---


## 2026-09-18 — Provider catalog/configuration design recorded

User approved the provider/model lifecycle design and requested it be added to the plan.

Permanent direction:
- separate Adapter → Provider Instance → Model;
- provider/model changes on an existing protocol are configuration operations;
- a new protocol adds an adapter rather than Router special cases;
- discovered models are not auto-enabled;
- routable set = available/discovered ∩ explicitly enabled;
- prefer disable for reversible changes;
- unavailable and disabled are distinct states;
- removal does not erase historical provider/model/route attribution;
- credentials are provider-scoped;
- future CLI/UI/API must share one Provider Configuration Service.

Implementation remains ordered: finish route snapshot/same-session switching first, then build provider configuration/discovery against that stable boundary.

---


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
