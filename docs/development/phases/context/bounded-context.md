# Bounded Context Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff; วัดกับ fixed dataset ก่อนขยาย retrieval backend

**Goal:** สร้าง context ที่พอดีต่อ role/model โดยไม่ทิ้งข้อกำหนดหรือหลักฐานสำคัญ  
**Architecture:** current state + ranked source refs → budgeted package → manifest → adapter  
**Tech Stack:** storage เดิม; metadata/lexical retrieval เริ่มต้น  
**Spec:** [data architecture](../../architecture/data-and-context.md), [quality gates](../../acceptance/quality-gates.md)

## เหตุผล

การตัดข้อความเก่าออกอาจลบเหตุผลสำคัญ ส่วนการสรุปทุกอย่างอาจสืบทอดความผิดพลาด ต้องมี both bounded working context และทางกลับไปแหล่งเดิม ไม่ตั้งเป้าให้โมเดลจำทุกอย่างใน prompt

## Work packages

### 5C — Budget and role context

**Files:** src/context/contracts.ts, src/context/context-builder.ts, src/context/token-budget.ts; tests/context/budget.test.ts

- [ ] buildContext(ticket, role, route, state_revision) คืน package และ manifest
- [ ] แยก pinned/required/optional records; reserve output/tool overhead/margin
- [ ] budget ไม่พอ pinned: คืน BLOCKED_CONTEXT_BUDGET ก่อน dispatch
- [ ] worker รับรายละเอียดงาน; reviewer รับ artifact/rubric/source; controller รับสถานะ/dependencies/budget
- [ ] สลับ model window แล้ว rebuild package จากข้อมูลจริงโดยไม่เปลี่ยน source
- [ ] ทดสอบ boundary windows และ malformed/unknown capability metadata
- [ ] commit token accounting และ inclusion/exclusion traces

**Manifest:** source IDs/revisions, reason for inclusion, omitted refs, estimated tokens, window, reserve, policy revision และ context hash

### 5D — Retrieval, summary and rehydration

**Files:** src/context/retrieval.ts, src/context/summaries.ts, src/context/rehydration.ts; tests/context/retrieval.test.ts, tests/context/stale-summary.test.ts

- [ ] retrieve ด้วย scope + IDs/metadata/lexical search ก่อน
- [ ] summary ระบุ source ranges, unresolved conflicts และ omissions
- [ ] lookup source เมื่อ summary ไม่พอตอบหรือ evidence เก่า
- [ ] reject stale evidence เมื่อ artifact/acceptance revision เปลี่ยน
- [ ] สร้าง fixed fixture 100 คำถามพร้อม authoritative answer/source IDs
- [ ] วัด required-fact recall, constraint preservation, token budget และ retrieval work
- [ ] commit evaluation report; vector backend เพิ่มได้เมื่อชี้ gap จากชุดนี้

## Acceptance targets ที่เสนอ

- pinned constraint presence 100% ใน package ที่ dispatch
- input + output reserve + overhead + margin ไม่เกิน window ทุก request
- fixture questions อย่างน้อย 95/100 ดึง required source ครบ; fact สำคัญต่อ acceptance ต้องครบ 100%
- source refs ที่ package อ้างเปิดได้ 100%; source หายต้อง fail closed ที่ gate นั้น
- zero out-of-scope records ใน cross-unit access fixtures
- obsolete summary ไม่ชนะ current explicit user instruction
- ไม่ส่ง raw history ทั้งหมดเพียงเพราะยังเหลือ token; ต้องมี relevance reason

ตัวเลขเป็น proposed engineering gates ไม่ใช่ผลที่วัดแล้ว ปรับได้ด้วย ADR และรายงาน trade-off ไม่ลดเกณฑ์เพื่อให้ผลเดิมผ่านเฉย ๆ

## Long-context experiment

ใช้ transcript fixture ที่ใหญ่กว่า input budget อย่างน้อย 10 เท่า มี constraint เปลี่ยนกลางทางและ fact สำคัญในช่วงต้น ให้ role หลายแบบทำงานต่อหลัง snapshot/restart แล้วเทียบ accepted outputs กับ ground truth

หาก source ต้องอ่านหลายรอบให้บันทึก retrieval cost และจำนวน calls; bounded context ที่แลกกับวนค้นไม่จบยังไม่ถือว่าผ่าน

**Exit gate:** budgets/recall/staleness/permissions ผ่าน; งานใน dataset ยังเดินต่อได้โดยไม่ต้องยัดประวัติทั้งหมดเข้า run เดียว
