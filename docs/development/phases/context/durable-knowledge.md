# Durable Knowledge Implementation Plan

> **For agentic workers:** ทำทีละ task พร้อม migration/rebuild evidence; ใช้ executing-plans หรือ handoff workflow

**Goal:** เก็บความต่อเนื่องที่จำเป็นนอก context โดยตรวจที่มาย้อนกลับได้  
**Architecture:** source records + accepted knowledge + projections + snapshots  
**Tech Stack:** DB/artifact store จากขั้น 3; index เป็น derived data  
**Spec:** [data architecture](../../architecture/data-and-context.md)

## เหตุผล

ประวัติทั้งหมดมีทั้งสิ่งที่จริงในอดีต สิ่งที่ถูกแก้ และข้อสันนิษฐาน การค้นพบข้อความหนึ่งไม่ได้แปลว่าข้อความนั้นยังใช้บังคับ จึงต้องแยก source/acceptance/supersession และรักษาคำสั่งปัจจุบัน

## Work packages

### 5A — Knowledge contract

**Files:** src/memory/contracts.ts, src/memory/knowledge-store.ts; tests/memory/authority.test.ts

- [ ] นิยาม intent, constraint, decision, fact, uncertainty และ artifact reference
- [ ] record มี source_refs, accepted_by, effective_revision และ supersedes_ref
- [ ] ผู้ใช้เปลี่ยนข้อกำหนด: เก็บฉบับเก่าและทำฉบับใหม่เป็น current แบบ transaction
- [ ] ข้อเสนอโมเดลไม่มี authority เปลี่ยน pinned constraint เอง
- [ ] ทดสอบ contradictory facts/obsolete decisions และ missing source
- [ ] commit contract พร้อมตัวอย่างข้อมูลที่เปิดอ่านได้

**Consumes:** user decisions, validated results, source records  
**Produces:** current authoritative constraints และ knowledge records แยกจาก raw transcript

### 5B — Persistence, projections, snapshots

**Files:** src/storage/migrations/add-knowledge-records.ts, src/memory/snapshots.ts, src/memory/projections.ts; tests/memory/rebuild.test.ts

- [ ] migration เก็บ knowledge/provenance และ current projections
- [ ] snapshot ระบุ source sequence range/hash/schema; ตรวจ consistent boundary
- [ ] rebuild projection จาก ledger/source records โดยไม่พึ่ง summary เพียงอย่างเดียว
- [ ] artifact integrity checker พบ missing/corrupt content แล้วไม่คืน valid evidence
- [ ] backup/restore รวม manifest; orphan GC เคารพ in-flight/grace/retention
- [ ] commit report migration, rebuild และ retained-history policy

## Acceptance scenarios

- constraint “งบไม่เกิน 5,000” เปลี่ยนเป็น “ไม่เกิน 3,000”: current เป็น 3,000 พร้อมที่มาเก่า/ใหม่
- summary เก่าระบุ 5,000: ไม่ทำให้ current constraint ย้อนกลับ
- knowledge ที่ไม่มี source เข้าสถานะ proposed/unverified ไม่ถูกใช้แทน accepted fact
- ลบ derived projection/index แล้ว rebuild: IDs/current facts/constraints ตรงกับก่อนลบ
- corruption ใน artifact: validation block และแจ้ง affected ticket
- snapshot ระหว่าง writer commit: ได้ consistent revision หรือ retry ไม่ผสมก่อน/หลัง
- reset all ล้าง knowledge/index/artifacts ใน scope โดยไม่มี restore อัตโนมัติจาก cache เก่า

**Exit gate:** integrity/rebuild/restore scenarios ผ่าน พร้อมชุดข้อมูลทดสอบที่ใช้ซ้ำใน bounded-context plan
