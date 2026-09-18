# ZOOID-0001 — Basic Chat Foundation

## Metadata

- ID: ZOOID-0001
- Status: IN_PROGRESS
- Started: 2026-09-18
- Repository: `funggier/Zooid-Agent`
- Branch: `agent/zooid-0001-basic-chat-foundation`
- Base SHA: `ecf1d582d09d9bc1798ad25c643e40f067c6bb23`
- Phase: Basic Provider Chat
- Previous planning input: `prepare-basic-chat.md`

## Why this task exists

Zooid มีแผนสถาปัตยกรรมและ roadmap แล้ว แต่ยังไม่มี application code ที่รันได้จริง งานแรกจึงต้องเปลี่ยน repository จาก planning-only state ให้เป็น executable software โดยเริ่มจากเส้นทางที่เล็กที่สุด:

`user input -> chat service -> provider contract -> response -> persisted session`

การเริ่มจาก basic chat ช่วยแยกปัญหา runtime/provider/session persistence ออกจากความซับซ้อนของ Router, Ticket, Recovery, Project และ Group

งานนี้ยังเป็นจุดเริ่มต้นของ durable GitHub development tracking ตามคำสั่งผู้ใช้ เพื่อให้ session ใหม่รับงานต่อจาก repository ได้โดยตรง

## Goal

สร้าง foundation ที่:

1. รันจาก checkout ได้ด้วยคำสั่งที่ชัดเจน
2. มี CLI chat ขั้นพื้นฐาน
3. มี provider interface ที่ทดสอบด้วย fake provider ได้
4. เก็บ session/message อย่างมีลำดับและเปิดกลับได้
5. รองรับ cancellation/error contract ขั้นพื้นฐาน
6. มี automated tests บน GitHub Actions
7. อัปเดต durable coordination state ทุก checkpoint สำคัญ

## Scope

อยู่ใน scope:

- เลือกและล็อก runtime/toolchain สำหรับ foundation
- project manifest / TypeScript configuration
- core chat message/session contracts
- file-backed session persistence สำหรับระยะแรก
- provider contract + fake provider
- CLI minimal interaction
- unit/integration tests
- CI workflow
- README setup/test/run instructions
- development task/report/checkpoint

ไม่อยู่ใน scope:

- provider router หลายตัว
- durable Ticket engine
- recovery orchestration
- Project/Group runtime
- background autonomous loop
- tool/skill ecosystem
- installer/updater เต็มรูปแบบ
- live provider credentials ใน repository

## Working decision

เริ่มด้วย TypeScript + Node.js ตาม candidate เดิม เพราะ repository ตั้งเป้า local modular monolith และ interface contracts ชัดเจน ตัวเลือกนี้ยังถือเป็น working decision จนกว่าจะผ่าน runnable/testable foundation; หากพบข้อจำกัดที่มีหลักฐานจึงเปิด decision task ใหม่แทนการเปลี่ยน stack เงียบ ๆ

## Planned implementation slices

### Slice A — Execution scaffold
- [ ] package manifest
- [ ] TypeScript config
- [ ] source/test layout
- [ ] test runner
- [ ] CI workflow

### Slice B — Chat domain
- [ ] message/session types
- [ ] stable ID generation
- [ ] ordered transcript model
- [ ] persistence contract
- [ ] file session store

### Slice C — Provider boundary
- [ ] provider request/result/error contracts
- [ ] fake provider
- [ ] cancellation behavior
- [ ] malformed/error fixtures

### Slice D — CLI
- [ ] create/open session
- [ ] send text
- [ ] exit
- [ ] display normalized error
- [ ] no secret logging

### Slice E — Verification
- [ ] unit tests
- [ ] persistence reopen test
- [ ] Thai/multiline input test
- [ ] cancellation/late-response test
- [ ] GitHub Actions green
- [ ] checkpoint report

## Acceptance criteria

Task จะ COMPLETE เมื่อ:

- clean checkout สามารถ install/build/test ได้ตาม README
- tests ยืนยัน ordered history และ reopen session
- fake provider success/error/cancel paths ผ่าน
- CLI สามารถคุยกับ fake provider ได้โดยไม่ต้องมี credential
- CI บน branch ผ่าน
- ACTIVE/STATUS/WORKLOG และ task นี้มี exact head/evidence/next state
- งานถัดไปถูกแยกเป็น numbered task ไม่แอบขยาย scope

## Progress log

### 2026-09-18 — Task opened

- ผู้ใช้อนุญาตให้เริ่มพัฒนา Zooid บน GitHub
- ผู้ใช้กำหนดให้มี task history ใน repository เพื่อรองรับ session handoff
- ตรวจ repository พบว่า implementation ยัง NOT_STARTED
- สร้าง branch `agent/zooid-0001-basic-chat-foundation`
- เริ่ม durable task sequence ด้วย ZOOID-0001

## Evidence

- Base commit: `ecf1d582d09d9bc1798ad25c643e40f067c6bb23`
- Planning spec: `docs/development/phases/basic-provider-chat.md`
- Development handoff: `docs/development/guides/development-handoff.md`

## Risks / open items

- live provider ยังไม่อยู่ใน scope ของ checkpoint แรก; fake provider ต้องทำให้ full local path ทดสอบได้ก่อน
- Windows qualification ต้องมีหลักฐานจาก runner/environment ที่เหมาะสม ไม่อ้างผ่านจาก CI Linux อย่างเดียว
- persistence แบบ file-backed เป็น foundation เท่านั้น; SQLite จะตัดสินใน phase ที่ต้องการ durability สูงขึ้น

## Next action

สร้าง execution scaffold + tests บน branch นี้ แล้วรัน GitHub Actions ให้ได้หลักฐาน GREEN ก่อนเริ่ม provider/live integration
