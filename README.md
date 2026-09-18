# Zooid

**Powered by CogentNexus**

Zooid เป็นโครงการสร้างโปรแกรมเอเจนต์ใหม่ เริ่มจากแชตที่เชื่อมต่อ provider ได้ แล้วค่อยเพิ่ม router, ticket, recovery และการจัดการ context เพื่อรองรับงานระยะยาว

แนวคิดหลักคือหน่วยงานที่ปรับโครงสร้างได้: เริ่มจาก Session เดียว แล้วเพิ่มบทบาทหรือเชื่อมงานเป็น Project และ Group เมื่อจำเป็น โดยรักษาที่มาของบทสนทนาและเจตนาของผู้ใช้

## สถานะ

Zooid มี Basic Chat foundation และ OpenAI-compatible Chat Completions transport ที่ผ่าน Ubuntu/Windows CI แล้ว รวมถึง live-qualification harness แบบสอง turn ที่ผ่าน deterministic fixtures

external real-model qualification ยังไม่ผ่าน เพราะต้องรันจาก environment ที่เข้าถึง endpoint จริงได้ Router จึงยัง gated

- [ZOOID-0001 — Basic Chat Foundation](docs/development/tasks/ZOOID-0001-basic-chat-foundation.md)
- [ZOOID-0002 — OpenAI-Compatible Provider Adapter](docs/development/tasks/ZOOID-0002-openai-compatible-provider.md)
- [ZOOID-0003 — External Live Provider Qualification](docs/development/tasks/ZOOID-0003-live-provider-qualification.md)

## Runtime

ต้องมี Node.js 24 หรือใหม่กว่า ปัจจุบันไม่มี runtime npm dependency ภายนอก

ทดสอบ:

```bash
npm test
```

## Fake provider mode

```bash
npm run chat
```

## OpenAI-compatible provider mode

Zooid รองรับ non-streaming Chat Completions endpoint ที่ `<base-url>/chat/completions`.

Environment variables:

- `ZOOID_PROVIDER=openai-compatible`
- `ZOOID_PROVIDER_BASE_URL`
- `ZOOID_PROVIDER_MODEL`
- `ZOOID_PROVIDER_API_KEY` — optional
- `ZOOID_PROVIDER_TIMEOUT_MS` — optional; default 120000 ms

PowerShell example:

```powershell
$env:ZOOID_PROVIDER = "openai-compatible"
$env:ZOOID_PROVIDER_BASE_URL = "http://127.0.0.1:11434/v1"
$env:ZOOID_PROVIDER_MODEL = "<installed-compatible-model>"
Remove-Item Env:ZOOID_PROVIDER_API_KEY -ErrorAction SilentlyContinue
npm run chat
```

If authentication is required, set `ZOOID_PROVIDER_API_KEY` only in the shell. Zooid does not auto-load `.env` in this checkpoint.

## Live provider qualification

ZOOID-0003 provides:

```powershell
npm run qualify:provider
```

The runner creates an isolated session and performs two turns:

1. turn 1 gives the real model a random marker;
2. turn 2 asks for that exact marker using the same persisted Zooid session.

PASS requires:
- exactly four ordered complete messages;
- the second response contains the exact random marker.

Example PowerShell setup:

```powershell
git fetch origin
git switch agent/zooid-0003-live-provider-qualification
git pull --ff-only

$env:ZOOID_PROVIDER = "openai-compatible"
$env:ZOOID_PROVIDER_BASE_URL = "http://127.0.0.1:11434/v1"
$env:ZOOID_PROVIDER_MODEL = "<installed-compatible-model>"
Remove-Item Env:ZOOID_PROVIDER_API_KEY -ErrorAction SilentlyContinue
$env:ZOOID_PROVIDER_TIMEOUT_MS = "120000"

npm run qualify:provider
```

Optional evidence retention:

```powershell
$env:ZOOID_QUALIFY_KEEP_DATA = "1"
npm run qualify:provider
```

Expected passing fields:

```json
{
  "outcome": "PASS",
  "messageCount": 4,
  "orderedCompleteTranscript": true,
  "markerRecovered": true
}
```

Do not commit API keys or raw secret-bearing shell history. Record only sanitized qualification results.

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
