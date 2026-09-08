# Context and Project Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff; ทำแผนย่อยตาม dependency และรักษา serial mode ตลอด

**Goal:** งานยาวรักษาเจตนาและหลักฐานภายใต้ context budget จน Project ตรวจรับได้  
**Architecture:** durable knowledge → bounded context → role runs → evidence → Project controller  
**Tech Stack:** core/storage เดิม; retrieval backend เพิ่มจากผลวัด  
**Spec:** [data](../architecture/data-and-context.md), [Work Unit](../architecture/work-unit-model.md), [execution](../architecture/execution-and-recovery.md)

## ทำไมขั้นนี้ใหญ่

การป้องกัน context เต็มไม่ได้จบที่ summarization ต้องจัดว่าอะไรเป็นข้อกำหนด อะไรเป็นเหตุการณ์ อะไรเป็นความรู้ที่ยังมีผล ใครต้องเห็นอะไร และผลจาก run ชั่วคราวควรกลายเป็นสถานะถาวรเมื่อใด

Project เป็นจุดตรวจว่าองค์ประกอบทั้งหมดทำงานร่วมกันได้จริง ไม่ใช่เพิ่มชื่อ Project ใน UI แล้วถือว่าขั้นนี้เสร็จ

## แผนย่อยและ dependency

| ส่วน | แผน | ส่งมอบ | ต้องผ่านก่อน |
| --- | --- | --- | --- |
| 5A–5B | [Durable knowledge](context/durable-knowledge.md) | source-linked knowledge, snapshots, schema migration | Recovery |
| 5C–5D | [Bounded context](context/bounded-context.md) | budgeted packing, retrieval, rehydration | 5A–5B |
| 5E | [Ephemeral review](context/ephemeral-review.md) | structured handoff, rubric, discard protocol | 5C–5D |
| 5F–5G | [Project runtime](context/project-runtime.md) | role scheduler, wait/wake, reshape, qualification | 5E |

## Components ที่ประกอบเป็น Project

- objective + pinned constraints + acceptance criteria
- ticket/dependency graph + ownership/revision
- role bindings: worker, reviewer, controller
- context policy แยกบทบาทและ per-run manifest
- provider policy แบบ serial หรือ bounded parallel
- evidence/knowledge/artifact references
- budget, retry/no-progress limits, stop/wait conditions
- current checkpoint และ completion gate

การคุยธรรมดาไม่ต้องสร้างสาม role เสมอ เปิด capability เมื่อ objective ต้องการ workflow เท่านั้น

## Integration contract

ProjectDecision: project_id, expected_revision, action(dispatch/wait/rework/complete/block), target_ticket, evidence_refs, reason, remaining_budget

Controller decision เป็นข้อเสนอที่ runtime validate: dependency พร้อม, scope ถูก, lease/budget พร้อม, acceptance ยังเป็นฉบับปัจจุบัน และไม่มี cancel flag ผล complete ต้องอ้าง gate result ไม่อ้างเพียงบทสรุปของ controller

## Phase-level work

- [ ] ปิด subplan 5A–5B พร้อม dataset และ rebuild evidence
- [ ] ปิด 5C–5D พร้อม token/recall/constraint results
- [ ] ปิด 5E พร้อม accepted handoff และ discard recovery traces
- [ ] ปิด 5F serial Project loop ก่อนเปิด parallel slots
- [ ] ปิด 5G fault/long-run/lifecycle qualification
- [ ] ทบทวน CNX baseline จาก revision จริงและปิดช่องว่างที่ต้องมี
- [ ] บันทึก Project demo พร้อม objective, run count, budgets, accepted artifacts และข้อจำกัด

## Exit gate

ผู้ใช้เริ่มจาก Session → เพิ่ม objective/roles → worker ทำ → reviewer ตรวจ → rework ตามเหตุผล → controller เลือกงานถัดไป → ตรวจรับได้ พร้อม restart ระหว่างทางโดยไม่เสียข้อกำหนด

ต้องผ่าน [quality gates](../acceptance/quality-gates.md) ทั้ง bounded context, stale evidence, cancellation, one-model scheduling และ lifecycle ของ temporary/background resources ก่อนเริ่ม Group เป็นแกนถัดไป

## สิ่งที่ยังไม่อยู่ในขั้นนี้

ไม่มีข้อสัญญาว่าทำงานสำเร็จได้ทุกเป้าหมายหรือไม่ต้องใช้คนอีกเลย งานที่ขาดข้อมูล/สิทธิ์/งบต้องรอหรือ block พร้อมเหตุผล การจัดกลุ่มบอทและการประสานหลายเครื่องเป็นงานหลัง Project core
