# Zooid Development Task Ledger

เอกสารในโฟลเดอร์นี้คือประวัติงานพัฒนา Zooid ที่ทำบน GitHub โดยตรง เพื่อให้ session/agent ใหม่สามารถอ่านสถานะปัจจุบันและย้อนดูเหตุผลของงานที่ผ่านมาได้โดยไม่ต้องพึ่งประวัติแชต

## Naming and ordering

ใช้เลขลำดับคงที่:

- `ZOOID-0001-<semantic-name>.md`
- `ZOOID-0002-<semantic-name>.md`
- ต่อเนื่องไปเรื่อย ๆ

เลขนี้เป็น **development task sequence** ไม่ใช่ software version

## Required task record

ทุก task ต้องเก็บอย่างน้อย:

- Task ID / title / status
- เหตุผลที่เกิดงานและปัญหาที่ต้องแก้
- เป้าหมายและขอบเขต
- สิ่งที่ไม่อยู่ในขอบเขต
- branch / base SHA / relevant commits
- แผนงานและ acceptance criteria
- สิ่งที่ทำไปแล้วตามลำดับ
- หลักฐาน test / workflow / report
- decisions และเหตุผล
- risks / blockers / open questions
- exact next action
- handoff note สำหรับ session ใหม่

## State sources

ให้อ่านตามลำดับนี้เมื่อเริ่ม session ใหม่:

1. `AGENTS.md`
2. `docs/development/coordination/ACTIVE.md`
3. `docs/development/coordination/STATUS.md`
4. task ปัจจุบันในโฟลเดอร์นี้
5. reports/evidence ที่ task อ้างถึง
6. task ก่อนหน้าเมื่อจำเป็นต้องเข้าใจที่มา

`ACTIVE.md` คือ pointer ของงานปัจจุบัน
`STATUS.md` คือภาพรวม phase
`WORKLOG.md` คือ timeline สั้น
Task file คือ durable reasoning/provenance ของงานแต่ละก้อน

## History rule

ห้ามลบ task เก่าเพียงเพราะงานเสร็จหรือเปลี่ยนแนวทาง ให้เปลี่ยน status และบันทึกสิ่งที่ supersede แทน เพื่อรักษาประวัติการตัดสินใจ
