# Zooid

**Powered by CogentNexus**

Zooid เป็นโครงการสร้างโปรแกรมเอเจนต์ใหม่ เริ่มจากแชตที่เชื่อมต่อ provider ได้ แล้วค่อยเพิ่ม router, ticket, recovery และการจัดการ context เพื่อรองรับงานระยะยาว

แนวคิดหลักคือหน่วยงานที่ปรับโครงสร้างได้: เริ่มจาก Session เดียว แล้วเพิ่มบทบาทหรือเชื่อมงานเป็น Project และ Group เมื่อจำเป็น โดยรักษาที่มาของบทสนทนาและเจตนาของผู้ใช้

## สถานะ

Implementation เริ่มแล้วภายใต้ [ZOOID-0001 — Basic Chat Foundation](docs/development/tasks/ZOOID-0001-basic-chat-foundation.md)

ปัจจุบัน branch งานมี minimal CLI chat, file-backed session persistence, provider contract, fake provider, automated tests และ GitHub Actions สำหรับ Ubuntu/Windows ส่วน live provider, router, ticket, recovery, Project และ Group ยังไม่ถือว่า implement แล้ว

## เริ่มใช้งาน development foundation

ต้องมี Node.js 24 หรือใหม่กว่า Foundation ปัจจุบันไม่มี runtime dependency ภายนอก จึงไม่ต้อง `npm install` ก่อนทดสอบ

ทดสอบ:

```bash
npm test
```

เปิด CLI ใน deterministic fake-provider mode:

```bash
npm run chat
```

คำสั่งใน CLI:

- `/new` สร้าง session ใหม่
- `/open <session-id>` เปิด session เดิม
- `/exit` ออกจากโปรแกรม
- `Ctrl+C` ระหว่าง provider request ใช้ยกเลิก request นั้น

ข้อมูล development session เก็บใน `.zooid-data/` โดยค่าเริ่มต้น หรือกำหนด root แยกด้วย environment variable `ZOOID_DATA_DIR`

## เอกสารการพัฒนา

- [Development index](docs/development/README.md)
- [ที่มาและเป้าหมาย](docs/development/vision-and-rationale.md)
- [ลำดับการพัฒนา](docs/development/roadmap.md)
- [Active work](docs/development/coordination/ACTIVE.md)
- [Development status](docs/development/coordination/STATUS.md)
- [Numbered task ledger](docs/development/tasks/README.md)
- [Development handoff](docs/development/guides/development-handoff.md)

Task number เป็นลำดับงานพัฒนาบน GitHub ไม่ใช่เลขเวอร์ชันซอฟต์แวร์ Branch ใช้สำหรับลงมือทำ ส่วนเอกสาร task/report ที่ merge แล้วเป็นประวัติถาวรของโครงการ
