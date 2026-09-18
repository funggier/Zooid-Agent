# ZOOID-0002 — OpenAI-Compatible Provider Adapter

## Metadata

- ID: ZOOID-0002
- Status: IN_PROGRESS
- Started: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0002-openai-compatible-provider`
- Base/main SHA: `a477fe7abedee21e03f171e249c5c8bdac7cdecb`
- Previous task: [ZOOID-0001 — Basic Chat Foundation](ZOOID-0001-basic-chat-foundation.md)
- Phase: Basic Provider Chat

## Why this task exists

ZOOID-0001 proved the deterministic internal path with a fake provider. Zooid still cannot reach a real model endpoint.

The next smallest boundary is therefore not Router/Ticket/Recovery. It is:

`Zooid config -> provider adapter -> HTTP protocol -> model endpoint -> normalized ChatResult`

The first protocol is named **OpenAI-compatible Chat Completions** rather than an OpenAI-specific provider. This keeps the adapter tied to a wire contract instead of a vendor identity and permits compatible local endpoints such as Ollama without making Zooid depend on an external SDK.

## External protocol evidence

At task start, official Ollama material documents an OpenAI-compatible `/v1/chat/completions` endpoint. OpenAI's current model documentation emphasizes the Responses API for current OpenAI models, so this task does not claim Chat Completions is the preferred OpenAI-native integration. A future OpenAI Responses adapter can remain separate.

Reference checked 2026-09-18:
- https://ollama.com/blog/openai-compatibility
- https://platform.openai.com/docs/models

## Goal

Create a real HTTP-capable provider path that:

1. keeps provider configuration outside transcripts and source control;
2. uses native Node.js HTTP/fetch capability with no mandatory SDK dependency;
3. maps Zooid messages to OpenAI-compatible Chat Completions JSON;
4. normalizes success, auth, rate-limit, timeout, network and malformed-response behavior;
5. preserves user-cancel semantics from ZOOID-0001;
6. can be exercised end-to-end against a local HTTP fixture in CI;
7. can point at a real compatible endpoint through environment configuration without code changes.

## Scope

In scope:

- provider selection setting: fake vs openai-compatible
- base URL/model/API-key/timeout configuration
- secret-safe validation and error messages
- native HTTP adapter
- request/response mapping
- HTTP/error normalization
- Retry-After parsing where available
- cancellation + timeout behavior
- local loopback HTTP fixture tests
- CLI path using selected provider
- README/configuration documentation
- Ubuntu/Windows CI
- task/report/coordination evidence

Out of scope:

- multiple providers active in one session
- provider Router/fallback policy
- OpenAI Responses API
- streaming
- tool calls
- vision/audio
- model discovery
- credential storage/keychain
- Ticket/Recovery/Project/Group
- background execution

## Configuration contract

Proposed environment surface:

- `ZOOID_PROVIDER=fake|openai-compatible`
- `ZOOID_PROVIDER_BASE_URL=<base ending in /v1 or equivalent>`
- `ZOOID_PROVIDER_MODEL=<model id>`
- `ZOOID_PROVIDER_API_KEY=<optional bearer token>`
- `ZOOID_PROVIDER_TIMEOUT_MS=<optional positive integer>`

Secrets must never be written to transcript, task, report or normal CLI output.

The default remains `fake` so a clean checkout remains deterministic and credential-free.

## Context mapping rule

A real adapter must not blindly replay every stored message.

For the current request it may send:
- prior `complete` user/assistant messages;
- the current `pending` user message.

It must exclude prior `failed` or `interrupted` messages, because the provider did not successfully consume/answer those attempts and replaying them silently would change provenance.

## Work slices

### A — Config boundary
- [ ] typed provider settings
- [ ] fake default
- [ ] validation without secret disclosure
- [ ] timeout parsing tests

### B — HTTP adapter
- [ ] request mapping
- [ ] optional Bearer auth
- [ ] response mapping
- [ ] error/status normalization
- [ ] malformed JSON/schema handling
- [ ] timeout vs user-cancel distinction

### C — CLI integration
- [ ] construct provider from settings
- [ ] safe provider/model banner
- [ ] preserve fake default
- [ ] missing/invalid config fails before dispatch

### D — Deterministic protocol tests
- [ ] local HTTP success fixture
- [ ] request-body/history filtering assertion
- [ ] auth header assertion without logging secret
- [ ] 401/403 auth
- [ ] 429 + Retry-After
- [ ] 5xx/network
- [ ] malformed JSON/schema
- [ ] timeout
- [ ] user cancellation
- [ ] CLI -> local HTTP fixture -> stdout smoke

### E — Evidence
- [ ] Ubuntu CI green
- [ ] Windows CI green
- [ ] report exact verified SHA/workflow
- [ ] document whether any external live endpoint was tested
- [ ] do not mark live endpoint VERIFIED unless observed

## Acceptance

This task may close with protocol/transport **VERIFIED against deterministic local HTTP fixtures** even if no external credential is available. In that case the report must state `EXTERNAL_LIVE_SMOKE: NOT_RUN` and the Basic Provider Chat phase remains open for live qualification.

The phase itself must not be declared complete until an authorized real compatible model endpoint returns a successful multi-turn chat and the result is recorded without exposing secrets.

## Progress

### 2026-09-18 — Task opened

- ZOOID-0001 merged to main at `a477fe7abedee21e03f171e249c5c8bdac7cdecb`.
- Main post-merge workflow `35358295752` passed Ubuntu and Windows.
- Created branch `agent/zooid-0002-openai-compatible-provider`.
- Selected protocol-oriented adapter boundary; vendor routing remains explicitly out of scope.

## Next action

Implement typed provider configuration and HTTP adapter tests before modifying the CLI construction path.
