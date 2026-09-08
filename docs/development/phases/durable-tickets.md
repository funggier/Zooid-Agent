# Durable Tickets Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff; ปิด transaction semantics ก่อนเริ่ม Recovery

**Goal:** ทุกงานที่ระบบรับมี durable identity และสถานะที่ตรวจย้อนหลังได้  
**Architecture:** ingress commit → ticket queue → attempt → result/validation → outbox  
**Tech Stack:** stack เดิม + SQLite driver ที่ผ่านการทดสอบตาม decision gate  
**Spec:** [execution](../architecture/execution-and-recovery.md), [data](../architecture/data-and-context.md)

## เหตุผลและความสำคัญ

session history บอกว่าคุยอะไร แต่ไม่ยืนยันว่าระบบรับงาน ส่งไปแล้ว สำเร็จ หรือส่งผลถึงผู้ใช้เมื่อใด Ticket แยก logical work ออกจากการเรียก provider แต่ละครั้ง ทำให้ขั้น recovery มีฐานข้อมูลที่เชื่อถือได้

ขั้นนี้นำ persistence สำหรับงานเข้ามาแล้ว; ขั้น 5 ขยายเป็น knowledge/context ไม่รอถึงขั้น 5 จึงเริ่ม DB

## Global constraints

ACK หลัง commit; transaction ไม่คร่อม network; idempotency key มาจาก ingress operation; ห้ามนับ provider call หลายครั้งเป็นงานคนละชิ้นเมื่อเป็น retry เดิม

## Contracts

submit(command, ingress_key, unit_id) → ticket_id, state, revision  
claim(ticket_id, expected_revision, owner) → attempt_id, epoch หรือ conflict  
recordResult(attempt_id, epoch, evidence_ref) → verifying ticket revision  
readTicket(ticket_id) → current state + ordered events + attempts + delivery status

กำหนด scope ของ ingress key เป็น (source, source_instance, request_key); ticket ซ้ำข้อความแต่ผู้ใช้สั่งใหม่ต้องมี request_key ใหม่ ไม่ dedupe จาก text อย่างเดียว

## Work packages

### Storage และ import

**Files:** src/storage/database.ts, src/storage/migrations/create-ticket-ledger.ts, src/storage/import-session-history.ts; tests/storage/transactions.test.ts

- [ ] เลือก driver ด้วย transaction/lock/restore fixtures บน target runtime
- [ ] สร้าง sessions/messages/tickets/attempts/events/results/deliveries ตาม logical schema
- [ ] unique constraints และ expected revision guards
- [ ] import history ขั้น 1 โดยรักษา ID/order; ทำซ้ำไม่เพิ่มข้อความซ้ำ
- [ ] backup/restore isolated dataset แล้วเทียบ counts/references
- [ ] commit migration และข้อจำกัด rollback

### Ticket service

**Files:** src/tickets/ticket-service.ts, src/execution/runner.ts; tests/tickets/ingress.test.ts, tests/tickets/transitions.test.ts

- [ ] commit ticket+queued event ก่อน ACK; duplicate ingress คืน ticket เดิม
- [ ] claim งานหนึ่งครั้งต่อ revision; invalid transition ต้องถูกปฏิเสธ
- [ ] บันทึก attempt/request identity ก่อนเรียก adapter
- [ ] แยก result, completion criteria และ delivery records
- [ ] UI แสดง queued/running/failed/complete ตาม durable state
- [ ] commit พร้อม state transition trace

### Result/outbox และ lifecycle

**Files:** src/execution/outbox.ts, src/lifecycle/manager.ts; tests/tickets/result-delivery.test.ts

- [ ] success และ pending delivery commit atomic
- [ ] output ที่ไม่ครบ/invalid ไม่เปลี่ยนเป็น success
- [ ] แสดงผลโดย delivery ID และรับ acknowledgement จาก local interface
- [ ] reset/backup รวม DB และ artifacts; ทดสอบ references หลัง restore
- [ ] commit พร้อม report transaction boundary และ crash cases ที่ส่งต่อขั้น 4

## Acceptance

| Fault/scenario | Expected result |
| --- | --- |
| duplicate ingress 10 ครั้งด้วย key เดิม | ticket เดียว; ไม่ dispatch ตามจำนวน ingress |
| same text แต่ request keys ต่างกัน | สองงานตามเจตนาผู้ใช้ |
| DB commit ล้มเหลว | ไม่มี ACK accepted; ไม่มี provider dispatch |
| workers claim revision เดียวกัน | สำเร็จรายเดียว |
| invalid transition RUNNING → SUCCEEDED โดยไม่มี result | ปฏิเสธ |
| success commit แล้วปิด UI ก่อนแสดงผล | ticket success + delivery pending |
| import history ซ้ำ | IDs/count/order เท่าเดิม |

**Exit gate:** persistence/transition tests ผ่านและเปิดอ่าน ticket หลัง restart ได้ อัตโนมัติ resume/retry ยังเป็นงานขั้น 4 ห้ามใช้คำว่า recovery พร้อมจากการมี DB เพียงอย่างเดียว
