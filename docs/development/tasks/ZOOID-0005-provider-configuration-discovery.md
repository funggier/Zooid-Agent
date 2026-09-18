# ZOOID-0005 — Provider Configuration and Discovery

## Metadata

- ID: ZOOID-0005
- Status: IN_PROGRESS
- Started: 2026-09-19
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0005-provider-configuration-discovery`
- Base/main SHA: `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`
- Base post-merge workflow: `35375409259` — SUCCESS, Ubuntu + Windows
- Previous task: [ZOOID-0004 — Provider Routing Foundation](ZOOID-0004-provider-routing.md)
- Phase: Provider Routing follow-on
- Primary phase plan: [Provider Routing](../phases/provider-routing.md)

## Origin and reason

ZOOID-0004 verified the routing boundary itself: Registry → Router → per-request route snapshot → ChatService → Provider Adapter, including A → B → A same-session switching and a real local Ollama routed CLI PASS.

The user then approved a permanent management rule:

```text
Adapter
  ↓
Provider Instance
  ↓
Models
```

Adding/removing an endpoint or model that already uses a supported protocol must be configuration work rather than a source-code change. A genuinely new protocol is the case that adds a new adapter.

ZOOID-0005 implements that management plane without weakening the ZOOID-0004 provenance guarantees.

## Goal

Build a durable, local-first Provider Configuration Service and read-only discovery boundary so Zooid can:

1. persist provider instances independently from adapter source code;
2. persist model allow/disable state per provider;
3. add, enable, disable and remove providers/models through one service;
4. distinguish user policy from observed provider availability;
5. derive routable models from explicit enablement plus availability;
6. keep secret material out of ordinary catalog persistence;
7. rebuild the Provider Registry from configuration without Router special cases;
8. ensure config reload cannot relabel or redirect an already snapshotted in-flight request;
9. expose the same management service to CLI now and future UI/API later.

## Non-goals

Not in ZOOID-0005:

- automatic fallback;
- latency/cost ranking;
- load balancing;
- billing;
- storing raw provider secrets in the catalog;
- a general OS keychain implementation;
- supporting every provider protocol;
- treating discovery as permission;
- deleting historical message/route attribution when catalog entries are removed;
- the dedicated `qwen3.8:27b` extended-wait live qualification;
- Ticket/Recovery semantics.

## Core state model

Desired policy and observed state are separate axes.

### Desired policy

- `enabled`: Zooid is permitted to route new work to this provider/model.
- `disabled`: configuration is retained, but Zooid must not route new work to it.
- `removed`: absent from the active catalog. Historical route/message provenance is untouched.

### Observed availability

- `available`: discovery/health evidence says the resource currently exists.
- `unavailable`: discovery/health evidence says it currently does not exist or cannot be used.
- `unknown`: no current discovery evidence.

A resource being discovered or installed never enables it automatically.

Baseline routing rule:

```text
explicitly enabled
      ∩
available or availability-not-required/unknown under explicit policy
      =
eligible for registry/routing
```

For providers with authoritative discovery enabled, discovered model membership constrains routability. For providers without discovery support, explicit configuration remains authoritative and availability is `unknown`.

## Catalog design direction

Initial durable format is a versioned JSON catalog under Zooid's data root, using atomic temp-write + rename semantics like existing session persistence. This keeps Phase 2 dependency-free; SQLite remains planned for durable Ticket state in Phase 3.

Proposed active path:

`<ZOOID_DATA_DIR>/providers/catalog.json`

Catalog schema revision begins at `1`.

Provider instance identity is stable and independent from adapter name.

A provider entry contains only non-secret configuration and references such as:

- provider ID;
- adapter kind;
- desired enabled state;
- adapter-safe endpoint/configuration;
- optional credential reference, never the secret value;
- models with desired enabled state;
- optional discovery configuration.

For OpenAI-compatible endpoints, embedded URL credentials remain forbidden.

## Discovery boundary

Discovery is separate from chat protocol adaptation.

Example:

```text
Provider instance: local-ollama
chat adapter:       openai-compatible
discovery driver:   ollama
```

This prevents Ollama-specific inventory logic from leaking into ProviderRouter or the generic OpenAI-compatible chat adapter.

Discovery is read-only by default. It may report models, but must not mutate enabled policy unless the user explicitly requests a configuration change.

## Work packages

### A — Durable catalog schema and store

Planned:
- `src/providers/config/provider-catalog.ts`
- `src/providers/config/file-provider-catalog-store.ts`
- `tests/provider-catalog-store.test.ts`

Acceptance:
- [x] versioned schema revision 1 exists;
- [x] missing catalog opens as an empty catalog without inventing providers;
- [x] save uses temp file + atomic rename;
- [x] reopen preserves provider/model ordering and policy;
- [x] duplicate/blank IDs and models are rejected;
- [x] unknown adapter kinds are rejected at validation boundary;
- [x] embedded endpoint credentials are rejected;
- [x] raw credential/secret values have no catalog field;
- [x] optional `credentialRef` is persisted as a reference only;
- [x] corrupt catalog is preserved and reported rather than overwritten;
- [x] tests require no network/model inference.

### B — Provider Configuration Service

Planned:
- `src/providers/config/provider-configuration-service.ts`
- deterministic service tests

Acceptance:
- [x] add provider instance using an already-supported adapter;
- [x] enable/disable provider reversibly;
- [x] remove provider from active catalog without touching session history;
- [x] add/enable/disable/remove model;
- [x] duplicate operations fail explicitly rather than silently replacing;
- [x] unavailable/observed state is not confused with disabled policy;
- [x] writes serialize through one durable service boundary.

### C — Runtime catalog → Registry integration

Acceptance:
- [x] adapter factory constructs supported runtime adapters from catalog entries;
- [x] Router does not special-case provider IDs or Ollama;
- [x] only eligible configured models enter the active ProviderRegistry;
- [x] credential references resolve through a separate resolver boundary;
- [x] unresolved required credential fails explicitly before dispatch;
- [x] legacy environment configuration remains usable until an explicit migration boundary is qualified;
- [x] catalog reload affects future route selections only;
- [x] an already snapshotted in-flight request retains its provider/model/adapter attribution even if provider/model is disabled or removed during execution.

### D — Discovery interface and Ollama inventory

Planned:
- generic read-only discovery contract;
- deterministic HTTP fixture tests;
- Ollama discovery driver as a provider-specific discovery implementation.

Acceptance:
- [ ] discovery returns observed models without enabling them;
- [ ] configured disabled model remains unroutable even if discovered;
- [ ] configured enabled model becomes unavailable when authoritative discovery does not report it;
- [ ] newly discovered model is visible but unroutable until explicit enable/add;
- [ ] discovery failure does not silently rewrite desired configuration;
- [ ] no discovery call is required for providers that do not declare a discovery driver.

### E — CLI management surface

Target commands use the same Provider Configuration Service intended for later UI/API.

Acceptance direction:
- [ ] list provider instances and desired/observed state;
- [ ] add/enable/disable/remove provider;
- [ ] list/add/enable/disable/remove model;
- [ ] run read-only discovery explicitly;
- [ ] no command prints credential secret material;
- [ ] chat CLI can select among catalog-backed routable provider/model entries;
- [ ] deterministic CLI smoke tests pass Ubuntu + Windows.

## Security invariants

- no raw API key/token/password in catalog JSON;
- no secret echo in normal CLI output;
- endpoint URLs may not embed username/password;
- provider credentials never cross provider instance boundaries;
- discovery cannot grant routing permission;
- catalog deletion/removal cannot erase historical message attribution.

## Slow single-model invariant

ZOOID-0005 must not introduce any helper-model dependency.

A catalog containing only `qwen3.8:27b` must remain a structurally valid configuration. Provider/model management logic must never classify it as unsuitable solely because it is slow.

Normal deterministic tests use fake/small fixtures for fast feedback. Dedicated 27B slow acceptance remains a separate live gate.

## Evidence rules

Every production slice records:
- RED evidence when behavior is new;
- minimal GREEN SHA;
- workflow ID;
- Ubuntu/Windows result;
- test count;
- live provider use if any;
- secret handling;
- exact unresolved gaps.

## Progress

### 2026-09-19 — Task opened

- PR #4 merged to `main` at `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`.
- Verified `main` points to the actual merge SHA.
- post-merge workflow `35375409259` completed SUCCESS on Ubuntu and Windows.
- created branch `agent/zooid-0005-provider-configuration-discovery`.
- carried forward the user-approved Adapter ≠ Provider Instance ≠ Model rule.
- chose a versioned file-backed catalog for Phase 2 so provider management remains zero-runtime-dependency and SQLite can remain a Phase 3 Ticket decision.
- separated desired policy from observed discovery availability.

### 2026-09-19 — Work Package A verified

TDD RED:
- test-only SHA: `b583b83c81f005a2446f8bd5bb2095c852ac3b2e`
- workflow: `35375708930`
- expected failure: 40 existing tests passed; new catalog test file failed because `provider-catalog.ts` did not yet exist.

Minimal GREEN:
- implementation SHA: `1a35200f24b5b08c9b1da07f399b2c68c7da35f3`
- workflow: `35375804129` — SUCCESS Ubuntu + Windows
- tests: 48 passed / 0 failed
- live provider/network/model inference: none

Implemented:
- versioned ProviderCatalog revision 1;
- strict supported adapter boundary (`fake`, `openai-compatible`);
- desired provider/model `enabled|disabled` policy;
- optional `credentialRef` only; raw secret-shaped fields are rejected as unknown;
- OpenAI-compatible and discovery URL credential/query/fragment rejection;
- optional independent `ollama` discovery configuration;
- missing-file → empty catalog semantics;
- atomic temp-write + rename;
- corrupt/schema-invalid catalog preservation via explicit error;
- stable provider/model ordering on reopen.

### 2026-09-19 — Work Package B verified

TDD RED:
- test-only SHA: `ac6a4ee6039558588c7db6951dd32da468143938`
- workflow: `35376019986`
- expected failure: 48 existing tests passed; configuration-service suite failed because the service module did not yet exist.

Minimal GREEN:
- implementation SHA: `4b8e5f234baa82c27d9c3e608612a7c24422ee86`
- workflow: `35376109866` — SUCCESS Ubuntu + Windows
- tests: 56 passed / 0 failed
- live provider/network/model inference: none

Verified:
- existing adapter types can receive new provider instances through configuration;
- provider enable/disable is reversible;
- provider removal only mutates the active catalog and does not rewrite persisted session attribution;
- model add/enable/disable/remove is provider-scoped;
- duplicate and not-found operations fail explicitly;
- desired policy does not invent observed availability;
- one service instance serializes concurrent mutations without lost updates;
- a `qwen3.8:27b`-only provider remains structurally valid regardless of expected latency.

### 2026-09-19 — Work Package C verified

TDD RED:
- test-only SHA: `5e7d3bfb97a5899c4ea1e8d4eedf122b08e87ae7`
- workflow: `35376392829`
- expected failure: 56 existing tests passed; new runtime suite failed because `provider-catalog-runtime.ts` did not yet exist.

Minimal GREEN:
- implementation SHA: `981d1284bb28b4a99d5145f75af70a0601a30ac2`
- workflow: `35376510252` — SUCCESS Ubuntu + Windows
- tests: 62 passed / 0 failed

Verified:
- enabled provider/model policy is the only catalog policy admitted to the Registry at this stage;
- provider instance ID remains independent from adapter implementation identity;
- built-in adapter factories create fake and OpenAI-compatible runtimes without Router special cases;
- credential references resolve through a separate resolver and unresolved references fail before live Registry replacement;
- Registry replacement validates the complete new registration set before swap;
- failed reload leaves the old Registry intact;
- existing environment-style runtime construction remains available;
- catalog reload changes future route resolution while an in-flight request retains its original resolved provider and durable attribution.

## Next action

Implement Work Package D using deterministic HTTP fixtures: generic read-only discovery result, Ollama inventory driver, availability overlay, and routable = enabled ∩ discovered for providers declaring authoritative discovery.
