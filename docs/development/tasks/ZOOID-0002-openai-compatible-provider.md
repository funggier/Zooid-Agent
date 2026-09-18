# ZOOID-0002 — OpenAI-Compatible Provider Adapter

## Metadata

- ID: ZOOID-0002
- Status: COMPLETE
- Started: 2026-09-18
- Completed: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0002-openai-compatible-provider`
- Base/main SHA: `a477fe7abedee21e03f171e249c5c8bdac7cdecb`
- Last verified implementation SHA: `26f5da9924892826bbcbe968f28cea72e639f889`
- Verified workflow: `35359099312` — SUCCESS, Ubuntu + Windows, 22/22 tests
- Previous task: [ZOOID-0001](ZOOID-0001-basic-chat-foundation.md)
- Report: [ZOOID-0002 report](../reports/ZOOID-0002-openai-compatible-provider-report.md)
- Phase: Basic Provider Chat
- External live smoke: NOT_RUN

## Why this task existed

ZOOID-0001 proved the deterministic internal path with a fake provider. Zooid still needed a real HTTP-capable boundary before Router/Ticket/Recovery work could be justified.

The implemented path is:

`Zooid config -> provider adapter -> HTTP Chat Completions -> normalized ChatResult`

The adapter is named **OpenAI-compatible** rather than OpenAI-specific so the code is tied to a wire contract, not a vendor identity.

## Protocol evidence

Checked 2026-09-18:

- Ollama documents OpenAI compatibility including `/v1/chat/completions`: https://ollama.com/blog/openai-compatibility
- OpenAI current model documentation centers current model integration around the Responses API: https://platform.openai.com/docs/models

Therefore this task does not claim Chat Completions is the preferred OpenAI-native future path. A Responses adapter can remain independent.

## Result

Implemented:

- [x] provider selection: fake vs openai-compatible
- [x] base URL/model/API-key/timeout settings
- [x] secret-safe validation and provider banner
- [x] native Node `fetch`; no SDK dependency
- [x] request/response mapping
- [x] history provenance filtering
- [x] optional Bearer auth
- [x] 401/403/429/5xx normalization
- [x] Retry-After parsing
- [x] malformed JSON/schema handling
- [x] timeout vs user cancellation
- [x] local loopback HTTP fixtures
- [x] CLI end-to-end HTTP fixture smoke
- [x] API-key non-leak assertion
- [x] path-with-spaces regression
- [x] blank-input transcript regression
- [x] Ubuntu CI
- [x] Windows CI
- [x] documentation/example configuration

Explicitly not included:

- external live model qualification
- provider Router/fallback
- OpenAI Responses API
- streaming/tool calls/vision/audio
- model discovery
- credential keychain
- Ticket/Recovery/Project/Group

## Configuration contract

- `ZOOID_PROVIDER=fake|openai-compatible`
- `ZOOID_PROVIDER_BASE_URL=<http(s) base>`
- `ZOOID_PROVIDER_MODEL=<model id>`
- `ZOOID_PROVIDER_API_KEY=<optional bearer token>`
- `ZOOID_PROVIDER_TIMEOUT_MS=<optional positive integer>`

Default remains fake. `.env` files are ignored and are not auto-loaded.

## Context mapping rule

The adapter sends:
- prior `complete` user/assistant messages;
- current `pending` user message.

It excludes prior `failed` and `interrupted` messages so failed attempts are not silently replayed as accepted conversational history.

## RED → GREEN history

### Initial implementation

Commit `11bf0566e943db21c08075448e01ff3da9c4bf10` added configuration, provider runtime, HTTP adapter and deterministic tests.

Workflow `35358864158` failed because the adapter used TypeScript constructor parameter properties. Node 24 strip-only mode rejects that syntax with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`.

### Minimal repair

Commit `04c0c434dbbbd4c4dda5b56e5dd20e117f51e240` replaced parameter properties with explicit erasable class fields/assignments. No compiler or package dependency was added.

Workflow `35358927800` then completed SUCCESS on Ubuntu and Windows with 19 tests.

### Acceptance completion

Additional tests covered data-root paths with spaces, blank input, HTTP 403 and HTTP 503.

Final verified implementation SHA:

`26f5da9924892826bbcbe968f28cea72e639f889`

Workflow `35359099312` completed SUCCESS on Ubuntu and Windows with:

- tests: 22
- pass: 22
- fail: 0
- Node: v24.20.0 on observed Ubuntu job

## Non-claim

`EXTERNAL_LIVE_SMOKE: NOT_RUN`

GitHub CI used loopback HTTP fixtures only. No external API key, Ollama model, OpenAI endpoint or other real model endpoint was contacted.

Therefore ZOOID-0002 is complete as a **protocol/transport task**, while the **Basic Provider Chat phase remains open**.

## Next action

Create ZOOID-0003 for external compatible endpoint qualification. It must prove at least one authorized real model endpoint with multi-turn history before Router work starts.

If no reachable endpoint is available to the executing session, ZOOID-0003 should be recorded as BLOCKED rather than pretending the live gate passed.
