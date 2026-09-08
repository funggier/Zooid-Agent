# Project Runtime Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff; เริ่ม concurrency = 1 ก่อนเพิ่ม parallel slots

**Goal:** Project เดิน worker → review → control ต่อเนื่องจนเข้า terminal/wait state ที่ถูกต้อง  
**Architecture:** Work Unit + dependency graph + role policies + durable scheduler  
**Tech Stack:** ticket/recovery/context/review ที่ผ่าน gate แล้ว  
**Spec:** [Work Unit](../../architecture/work-unit-model.md), [execution](../../architecture/execution-and-recovery.md)

## เหตุผล

ผู้ควบคุมภาพรวมไม่ควรเก็บทุกอย่างไว้ใน session ของตน Scheduler ต้องรักษางานค้างและสิ่งที่รอ ส่วน controller ใช้ภาพสถานะขนาดพอดีเพื่อเสนอขั้นถัดไป ระบบจึงฟื้นได้แม้ controller run หาย

## Work packages

### 5F — Solo Project

**Files:** src/work/work-unit-service.ts, src/projects/contracts.ts, src/projects/scheduler.ts, src/projects/controller.ts; tests/projects/solo.test.ts

- [ ] เพิ่ม objective/roles ให้ session เดิมโดยรักษา ID/transcript refs
- [ ] ticket dependencies ต้องไม่มี cycle และมี owner ชัด
- [ ] schedule worker → ephemeral reviewer → controller ตาม readiness
- [ ] controller proposal ต้องผ่าน expected revision, budget, cancel และ acceptance guards
- [ ] rework ผูกกับ findings ไม่สร้างงานกว้างใหม่โดยไร้ข้อจำกัด
- [ ] มี max attempts/no-progress threshold; BLOCKED ระบุสิ่งที่ต้องแก้
- [ ] commit serial Project demo ใช้ provider/model เดียวทุกบทบาท

**Consumes:** Project objective, ready tickets, validation records  
**Produces:** committed next-action decision หรือ wait/terminal state

### Durable waiting and background runner

**Files:** src/projects/wake-store.ts, src/execution/background-runner.ts; tests/projects/wake.test.ts

- [ ] wait record เก็บ event/dependency/time/user-input condition และ revision
- [ ] event arrival กับ sleep transition ใช้ transactional check ป้องกัน lost wake
- [ ] replay event ซ้ำไม่ schedule logical task ซ้ำ
- [ ] idle runner ไม่เรียก LLM จนมี eligible work
- [ ] stop/cancel persist แล้ว restart ไม่ปลุกงานที่ยกเลิก
- [ ] ลงทะเบียน lifecycle ownership สำหรับ background resources เมื่อเปิดใช้
- [ ] commit restart/wake traces และข้อความ UI แสดงว่ารออะไร

### 5G — Reshape, bounded parallelism and qualification

**Files:** src/projects/resource-budget.ts, src/work/structure-transactions.ts; tests/projects/parallel.test.ts, tests/work/reshape.test.ts

- [ ] เพิ่ม concurrency slots โดยใช้ provider quota/global project budget เดียว
- [ ] จอง budget ก่อน dispatch และ reconcile usage หลังผล; ไม่ปล่อยหลาย worker ใช้งบก้อนเดียวซ้ำ
- [ ] ป้องกัน conflicting writes ของ artifact ด้วย revision/workspace isolation
- [ ] promote/demote ขณะ idle/paused; active ownership change ต้อง drain/reconcile
- [ ] long-run fixture และ real provider bounded run ตาม quality gates
- [ ] เทียบ CNX baseline ที่จำเป็นและปิด lifecycle checklist
- [ ] commit qualification report และอัปเดต phase status จากหลักฐาน

## Project acceptance

เริ่ม Session วางแผนงานเล็ก สร้าง objective และ criteria 3 ข้อ Worker ส่ง artifact ที่มี seeded defect Reviewer ส่ง REWORK Worker แก้ Reviewer ตรวจผ่าน Controller ตรวจครบแล้ว SUCCEEDED

ทำซ้ำโดย crash หลัง worker result และระหว่าง wait; ต้องคง ticket identity, constraints, accepted evidence และไม่ส่งงานซ้ำ เพิ่ม test ที่ artifact เปลี่ยนหลัง PASS ต้อง invalidation ก่อน complete

Solo ต้องผ่านก่อน parallel; ทดสอบ parallel สอง worker แตะผลเดียวกันแล้วมี conflict ที่จัดการได้ ไม่ใช่ last writer wins ที่ทำหลักฐานหาย

**Exit gate:** Project ใช้งานได้ทั้ง serial และ bounded parallel option, wait/wake ถูกต้อง, context bounded, human stop มีผล และ long-run/lifecycle evidence ผ่าน จึงถือว่าปิดขั้น 5 แล้ว
