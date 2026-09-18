# Zooid

**Powered by CogentNexus**

Zooid เป็นโครงการสร้างโปรแกรมเอเจนต์ใหม่ เริ่มจากแชตที่เชื่อมต่อ provider ได้ แล้วค่อยเพิ่ม router, ticket, recovery และการจัดการ context เพื่อรองรับงานระยะยาว

แนวคิดหลักคือหน่วยงานที่ปรับโครงสร้างได้: เริ่มจาก Session เดียว แล้วเพิ่มบทบาทหรือเชื่อมงานเป็น Project และ Group เมื่อจำเป็น โดยรักษาที่มาของบทสนทนาและเจตนาของผู้ใช้

## สถานะ

Basic Provider Chat ผ่าน real-model qualification แล้ว

Verified path:
`Zooid -> OpenAI-compatible HTTP -> local Ollama -> real model -> persisted multi-turn history`

ZOOID-0003 passed against `qwen3:1.7b` on the real Windows host with exact random-marker recovery across two turns.

Provider Routing is the next implementation phase after ZOOID-0003 merge.

- [ZOOID-0001 — Basic Chat Foundation](docs/development/tasks/ZOOID-0001-basic-chat-foundation.md)
- [ZOOID-0002 — OpenAI-Compatible Provider Adapter](docs/development/tasks/ZOOID-0002-openai-compatible-provider.md)
- [ZOOID-0003 — External Live Provider Qualification](docs/development/tasks/ZOOID-0003-live-provider-qualification.md)

## Runtime

ต้องมี Node.js 24 หรือใหม่กว่า ปัจจุบันไม่มี runtime npm dependency ภายนอก

```bash
npm test
```

## Fake provider mode

```bash
npm run chat
```

## OpenAI-compatible provider mode

Environment variables:

- `ZOOID_PROVIDER=openai-compatible`
- `ZOOID_PROVIDER_BASE_URL`
- `ZOOID_PROVIDER_MODEL`
- `ZOOID_PROVIDER_API_KEY` — optional
- `ZOOID_PROVIDER_TIMEOUT_MS` — optional; default 120000 ms

Example:

```powershell
$env:ZOOID_PROVIDER = "openai-compatible"
$env:ZOOID_PROVIDER_BASE_URL = "http://127.0.0.1:11434/v1"
$env:ZOOID_PROVIDER_MODEL = "qwen3:1.7b"
Remove-Item Env:ZOOID_PROVIDER_API_KEY -ErrorAction SilentlyContinue
npm run chat
```

## Live provider qualification

```powershell
npm run qualify:provider
```

PASS requires:
- real endpoint response;
- exactly four ordered complete persisted messages;
- exact recovery of the random marker from the previous turn.

ZOOID-0003 verified this against local Ollama `0.32.15` with `qwen3:1.7b`.

A 27B CPU-only model was also observed to exceed practical latency on the same host, which is treated as a performance/resource issue rather than a functional failure.

## CLI commands

- `/new`
- `/open <session-id>`
- `/exit`
- `Ctrl+C` during provider request cancels that request

Default session data root is `.zooid-data/`, override with `ZOOID_DATA_DIR`.

## เอกสารการพัฒนา

- [Development index](docs/development/README.md)
- [Active work](docs/development/coordination/ACTIVE.md)
- [Development status](docs/development/coordination/STATUS.md)
- [Numbered task ledger](docs/development/tasks/README.md)
- [Development reports](docs/development/reports/README.md)
- [Development handoff](docs/development/guides/development-handoff.md)

Task number เป็น development-history sequence ไม่ใช่ software version.
