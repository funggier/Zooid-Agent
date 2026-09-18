# Zooid

**Powered by CogentNexus**

Zooid เป็นโครงการสร้างโปรแกรมเอเจนต์ใหม่ เริ่มจากแชตที่เชื่อมต่อ provider ได้ แล้วค่อยเพิ่ม router, ticket, recovery และการจัดการ context เพื่อรองรับงานระยะยาว

แนวคิดหลักคือหน่วยงานที่ปรับโครงสร้างได้: เริ่มจาก Session เดียว แล้วเพิ่มบทบาทหรือเชื่อมงานเป็น Project และ Group เมื่อจำเป็น โดยรักษาที่มาของบทสนทนาและเจตนาของผู้ใช้

## สถานะ

Zooid มี Basic Chat foundation ที่รันได้จริง และมี OpenAI-compatible Chat Completions transport ที่ผ่าน deterministic HTTP fixtures บน Ubuntu และ Windows

สิ่งที่ **ยังไม่ถือว่าผ่าน** คือ external live model smoke test. Router, Ticket, Recovery, Project และ Group ยังไม่เริ่ม implementation.

- [ZOOID-0001 — Basic Chat Foundation](docs/development/tasks/ZOOID-0001-basic-chat-foundation.md)
- [ZOOID-0002 — OpenAI-Compatible Provider Adapter](docs/development/tasks/ZOOID-0002-openai-compatible-provider.md)

## Runtime

ต้องมี Node.js 24 หรือใหม่กว่า ปัจจุบันไม่มี runtime npm dependency ภายนอก จึงไม่ต้อง `npm install` เพื่อรัน foundation/test suite

ทดสอบ:

```bash
npm test
```

## Fake provider mode

ค่าเริ่มต้นเป็น deterministic fake provider:

```bash
npm run chat
```

เหมาะสำหรับ development/regression test เพราะไม่ต้องใช้ network หรือ credentials

## OpenAI-compatible provider mode

Zooid รองรับ non-streaming Chat Completions endpoint ที่ `<base-url>/chat/completions`.

Environment variables:

- `ZOOID_PROVIDER=openai-compatible`
- `ZOOID_PROVIDER_BASE_URL` — เช่น base URL ที่ลงท้ายด้วย `/v1`
- `ZOOID_PROVIDER_MODEL`
- `ZOOID_PROVIDER_API_KEY` — optional; ส่งเป็น Bearer token เมื่อกำหนด
- `ZOOID_PROVIDER_TIMEOUT_MS` — optional; default 120000 ms

PowerShell example สำหรับ compatible local endpoint:

```powershell
$env:ZOOID_PROVIDER = "openai-compatible"
$env:ZOOID_PROVIDER_BASE_URL = "http://127.0.0.1:11434/v1"
$env:ZOOID_PROVIDER_MODEL = "gpt-oss:20b"
# ถ้า endpoint ต้องใช้ token:
# $env:ZOOID_PROVIDER_API_KEY = "<set-secret-in-shell-only>"
npm run chat
```

Bash example:

```bash
export ZOOID_PROVIDER=openai-compatible
export ZOOID_PROVIDER_BASE_URL=http://127.0.0.1:11434/v1
export ZOOID_PROVIDER_MODEL='gpt-oss:20b'
# export ZOOID_PROVIDER_API_KEY='<set-secret-in-shell-only>'
npm run chat
```

`.env.example` เป็นเอกสารตัวอย่างเท่านั้น Zooid **ไม่ auto-load .env** ใน checkpoint นี้ และ `.env/.env.*` ถูก ignore เพื่อช่วยลดความเสี่ยง commit secret โดยไม่ตั้งใจ

Official Ollama documentation describes OpenAI compatibility for `/v1/chat/completions`: https://ollama.com/blog/openai-compatibility

ZOOID-0002 ทดสอบ protocol ด้วย local HTTP fixtures เท่านั้น ไม่ได้พิสูจน์ endpoint/model ภายนอกจริง

## CLI commands

- `/new` สร้าง session ใหม่
- `/open <session-id>` เปิด session เดิม
- `/exit` ออกจากโปรแกรม
- `Ctrl+C` ระหว่าง provider request ใช้ยกเลิก request นั้น

ข้อมูล development session เก็บใน `.zooid-data/` โดยค่าเริ่มต้น หรือกำหนด root แยกด้วย `ZOOID_DATA_DIR`

## เอกสารการพัฒนา

- [Development index](docs/development/README.md)
- [Active work](docs/development/coordination/ACTIVE.md)
- [Development status](docs/development/coordination/STATUS.md)
- [Numbered task ledger](docs/development/tasks/README.md)
- [Development reports](docs/development/reports/README.md)
- [Development handoff](docs/development/guides/development-handoff.md)

Task number เป็นลำดับงานพัฒนาบน GitHub ไม่ใช่เลขเวอร์ชันซอฟต์แวร์ Branch ใช้สำหรับลงมือทำ ส่วน task/report ที่ merge เข้า main เป็นประวัติถาวรของโครงการ
