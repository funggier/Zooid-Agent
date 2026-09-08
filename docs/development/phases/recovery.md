# Recovery Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff และบันทึก fault-injection evidence ตาม tested SHA

**Goal:** กลับมาดำเนินงานที่ค้างอย่างถูกต้องหลัง crash/provider failure/restart  
**Architecture:** durable tickets + lease fencing + reconciliation + outbox replay  
**Tech Stack:** stack/storage จากขั้น 3; fault-injection runner ใน isolated workspace  
**Spec:** [execution](../architecture/execution-and-recovery.md), [lifecycle](../architecture/lifecycle-management.md)

## เหตุผลและความสำคัญ

การรันใหม่ไม่ได้เท่ากับฟื้นงานได้ ผลภายนอกอาจเกิดแล้วแต่ response หาย Recovery ต้องแยก “ยังไม่ได้ทำ”, “ทำแล้ว”, และ “ยังพิสูจน์ไม่ได้” รวมทั้งไม่ทำงานที่ผู้ใช้ยกเลิกกลับมา

## Global constraints

ไม่มี blind retry ของ UNKNOWN side effect; cancel เป็น durable state; outbox replay ใช้ result เดิม; stale epoch ไม่มีสิทธิ์ dispatch/commit

## Work packages

### Lease and reconciliation

**Files:** src/execution/recovery.ts, src/execution/leases.ts; tests/recovery/lease-fencing.test.ts, tests/recovery/outcomes.test.ts

- [ ] startup scan nonterminal tickets/attempts และ classify จาก durable markers
- [ ] lease acquire/renew/release มี epoch guard
- [ ] ปฏิเสธ old worker หลัง takeover; บันทึก in-flight uncertainty
- [ ] fake provider มี queryable receipt กับ non-queryable mode เพื่อทดสอบทั้งสองกรณี
- [ ] UNKNOWN ที่ไม่มีหลักฐานเข้าสู่ BLOCKED พร้อมทาง resolve
- [ ] commit fault traces ของ crash ก่อน/หลัง dispatch

**Consumes:** outstanding attempts + operation receipts  
**Produces:** resume/reconcile/block decision ที่บันทึกเหตุผล

### Retry, delivery และ cancellation

**Files:** src/execution/retry-policy.ts, src/execution/outbox.ts, src/execution/runner.ts; tests/recovery/replay.test.ts, tests/recovery/cancel.test.ts

- [ ] classify transient/permanent errors; exponential backoff แบบมีเพดานและ max attempts
- [ ] เก็บ not-before และ remaining budget แบบ durable
- [ ] retry สร้าง attempt ใหม่ภายใต้ ticket เดิม; logical operation identity คงเดิมเมื่อเป็นผลเดียวกัน
- [ ] delivery retry ไม่เรียก provider ใหม่
- [ ] cancel ระหว่าง queued/running/waiting/delivery พร้อม late-result policy
- [ ] commit พร้อม duplicate-effect และ user-stop evidence

### Runtime/lifecycle qualification

**Files:** src/lifecycle/manager.ts; tests/lifecycle/restart.test.ts, tests/lifecycle/update-drain.test.ts

- [ ] drain ingress/runner และรอหรือ reconcile active work
- [ ] fault injection ที่ result commit, outbox send, activation และ cleanup
- [ ] restart สอง runner พร้อมกัน: generation/lease ต้องกัน double work
- [ ] ทดสอบ install-over/reset ไม่ปลุก ticket เก่าโดยไม่ได้ตั้งใจ
- [ ] ทำ [CNX baseline](../acceptance/cogentnexus-baseline.md) ส่วน execution/recovery
- [ ] commit report ที่แยก fixtures, actual restart และ Windows evidence

## Exit gate

ผ่าน fault matrix ใน [quality gates](../acceptance/quality-gates.md), ไม่มี duplicate logical effect ใน fixture ที่รองรับ idempotency, unknown outcome ทุกกรณีมีสถานะและทางแก้, user cancel ไม่ถูกปลุกใหม่

อย่างน้อยหนึ่ง integration run ต้อง restart process จริง; simulated crash อย่างเดียวไม่เท่ากับพิสูจน์ OS lifecycle ส่วน installer Windows ต้องทดสอบในเครื่อง/VM ที่มีสิทธิ์และกำหนด scope แล้ว

ก่อนประกาศ baseline เทียบเท่า CNX ต้องมี revision/source/evidence ของรายการที่นำมาเทียบ ถ้าหาไม่ได้ให้สถานะ NOT_EVALUATED และห้ามใช้คำว่าเทียบเท่าแล้ว

**Deferred:** Project scheduler และการแก้ context อัตโนมัติ แต่ recovery APIs ต้องไม่ผูกกับ CLI prompt เพื่อให้ scheduler ใช้ต่อได้
