# Zooid Development Task Ledger

เอกสารในโฟลเดอร์นี้คือประวัติงานพัฒนา Zooid ที่ทำบน GitHub โดยตรง เพื่อให้ session/agent ใหม่สามารถอ่านสถานะปัจจุบันและย้อนดูเหตุผลของงานที่ผ่านมาได้โดยไม่ต้องพึ่งประวัติแชต

## Task index

| ID | Task | Status | Branch / outcome |
| --- | --- | --- | --- |
| ZOOID-0001 | [Basic Chat Foundation](ZOOID-0001-basic-chat-foundation.md) | COMPLETE | merged to `main` via PR #1 |
| ZOOID-0002 | [OpenAI-Compatible Provider Adapter](ZOOID-0002-openai-compatible-provider.md) | COMPLETE | merged to `main` via PR #2 |
| ZOOID-0003 | [External Live Provider Qualification](ZOOID-0003-live-provider-qualification.md) | COMPLETE | merged to `main` via PR #3; real Ollama multi-turn PASS |
| ZOOID-0004 | [Provider Routing Foundation](ZOOID-0004-provider-routing.md) | IN_PROGRESS | `agent/zooid-0004-provider-routing` |

## Naming and ordering

ใช้เลขลำดับคงที่ `ZOOID-0001`, `ZOOID-0002`, ... เป็น **development task sequence** ไม่ใช่ software version.

## Required task record

ทุก task ต้องเก็บอย่างน้อย: ID/title/status, origin/reason, goal/scope/non-scope, branch/base/relevant commits, plan/acceptance, progress, evidence, decisions, risks/blockers, exact next action และ handoff note.

## State sources

เมื่อเริ่ม session ใหม่ให้อ่าน:

1. `AGENTS.md`
2. `docs/development/coordination/ACTIVE.md`
3. `docs/development/coordination/STATUS.md`
4. task ปัจจุบัน
5. reports/evidence ที่ task อ้างถึง
6. task ก่อนหน้าเมื่อจำเป็น

`ACTIVE.md` คือ pointer งานปัจจุบัน, `STATUS.md` คือภาพรวม phase, `WORKLOG.md` คือ timeline สั้น, Task/Report คือ durable provenance.

## History rule

ห้ามลบ task เก่าเพียงเพราะงานเสร็จหรือเปลี่ยนแนวทาง ให้เปลี่ยน status และบันทึกสิ่งที่ supersede แทน เพื่อรักษาประวัติการตัดสินใจ.
