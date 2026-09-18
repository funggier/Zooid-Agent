# Worklog

## 2026-09-18 — Implementation start and durable GitHub task history

ผู้ใช้อนุญาตให้เริ่มพัฒนา Zooid บน GitHub และกำหนดให้ทุกงานมีประวัติ Task อยู่ใน repository เพื่อให้ session ใหม่สามารถอ่านสถานะปัจจุบันและย้อนหลังได้

ตรวจ repository ปัจจุบัน: default branch `main`, latest baseline commit `ecf1d582d09d9bc1798ad25c643e40f067c6bb23`, implementation เดิมยัง NOT_STARTED

สร้าง working branch:

`agent/zooid-0001-basic-chat-foundation`

สร้าง task ledger ที่ `docs/development/tasks/README.md` และเปิดงานแรก:

`ZOOID-0001 — Basic Chat Foundation`

Task sequence นี้เป็นเลขลำดับงานพัฒนา ไม่ใช่ software version และต้องเก็บเหตุผล ขอบเขต progress evidence blocker และ exact next action ไว้ถาวร

งานถัดไปคือสร้าง runnable TypeScript/Node foundation + fake provider + persistence + tests + GitHub Actions ภายใต้ ZOOID-0001

---

## 2026-09-08 — New repository development plan

ผู้ใช้แจ้งว่าเปลี่ยนชื่อ repository เดิมและสร้าง funggier/Zooid-Agent ใหม่ ขอชุดเอกสาร .md ในโฟลเดอร์ภาษาอังกฤษ พร้อมที่มา เหตุผล ความสำคัญ และรายละเอียดองค์ประกอบของทุกขั้น

ตรวจ GitHub: repository ID 1361581818, fork=false, default branch main; ขณะตรวจยังไม่มี branch หรือไฟล์ Source/runtime ของ Hermes ไม่ได้นำมาคัดลอก

บันทึกแนวทางสร้างใหม่: Chat → Router → Ticket → Recovery → Context/Project → Group รวม Work Unit ที่ปรับโครงสร้างได้, ephemeral review, one-model scheduling, clean lifecycle และ extension contracts

สร้าง root README/AGENTS และ docs/development แยก vision, scope, architecture, phases/subplans, decisions, acceptance, handoff, coordination, task/report templates

สถานะ software ณ checkpoint นี้ยัง NOT_STARTED การสั่งทำเอกสารไม่ถูกตีความว่าเริ่ม implementation หรือเปิด runner อัตโนมัติ
