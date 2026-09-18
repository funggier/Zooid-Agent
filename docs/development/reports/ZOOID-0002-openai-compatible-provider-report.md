# ZOOID-0002 — OpenAI-Compatible Provider Adapter Report

## Result

**PASS — protocol/transport scope complete**

**EXTERNAL_LIVE_SMOKE: NOT_RUN**

Zooid now has a native HTTP OpenAI-compatible Chat Completions adapter that is selectable through environment configuration without changing ChatService or storing secrets in transcripts/source.

## Verified source

- Branch: `agent/zooid-0002-openai-compatible-provider`
- Base/main: `a477fe7abedee21e03f171e249c5c8bdac7cdecb`
- Last verified implementation SHA: `26f5da9924892826bbcbe968f28cea72e639f889`
- Final implementation workflow: `35359099312`
- Result: SUCCESS on Ubuntu + Windows
- Observed Ubuntu runtime: Node.js `v24.20.0`
- Tests: 22 passed / 0 failed

## Implemented contracts

### Configuration

Typed environment configuration supports fake and openai-compatible modes, validates HTTP(S) base URLs, model and timeout, and keeps API key optional.

Base URLs containing embedded credentials, query strings or fragments are rejected. Normal CLI/config error output does not include the API key.

### HTTP transport

The adapter uses native Node `fetch` and posts non-streaming JSON to:

`<base-url>/chat/completions`

Optional API key is sent as a Bearer header.

### History provenance

Only prior `complete` messages plus the current `pending` user message are sent. Prior `failed`/`interrupted` attempts are excluded.

### Result/error normalization

Verified fixture behavior:

- success + response ID + usage
- no Authorization header when key absent
- 401/403 → auth
- 429 → rate_limit + Retry-After
- 503/fetch failure → network
- malformed JSON/schema → invalid_response
- provider timeout → timeout
- user AbortSignal → AbortError/cancel path

Provider response bodies are not copied into safe errors.

## End-to-end fixture evidence

The CLI smoke test launches Zooid as a child process, configures an OpenAI-compatible loopback server, sends a user message, receives the fixture assistant response and exits cleanly.

The test asserts that the configured secret:
- reaches the fixture only as the Authorization header;
- does not appear in stdout;
- does not appear in stderr.

## Regression evidence

The suite also retains ZOOID-0001 guarantees and adds:
- blank input leaves transcript unchanged;
- data root paths containing spaces work;
- corrupt session preservation;
- Thai/multiline content;
- cancellation without late assistant reply.

## RED → GREEN evidence

Workflow `35358864158` failed because the first adapter implementation used TypeScript constructor parameter properties, incompatible with Node 24 strip-only execution.

Commit `04c0c434dbbbd4c4dda5b56e5dd20e117f51e240` restored the existing erasable-TypeScript baseline without adding a compiler/dependency.

Workflow `35358927800` passed both OSes. Final acceptance additions were then verified by workflow `35359099312`, also passing both OSes.

## External protocol references checked

Checked 2026-09-18:

- Ollama OpenAI compatibility: https://ollama.com/blog/openai-compatibility
- OpenAI model documentation: https://platform.openai.com/docs/models

The adapter name intentionally describes protocol compatibility. This report does not represent it as the preferred OpenAI-native API.

## Limitations / non-claims

- external model endpoint: NOT_TESTED
- live multi-turn model conversation: NOT_TESTED
- streaming: NOT_IMPLEMENTED
- tools/function calling: NOT_IMPLEMENTED
- model discovery: NOT_IMPLEMENTED
- provider Router/fallback: NOT_STARTED
- credential keychain/store: NOT_IMPLEMENTED
- user-machine Windows qualification: NOT_RUN

## Phase consequence

Basic Provider Chat remains OPEN until a real authorized compatible endpoint succeeds with a multi-turn conversation and that evidence is recorded without exposing secrets.

Router remains gated behind that result.
