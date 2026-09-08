# Ephemeral Review Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff; เก็บผลและหลักฐานก่อน cleanup working context

**Goal:** ใช้ session ชั่วคราวตรวจงานแล้วนำผลกลับมาได้อย่างเชื่อถือได้  
**Architecture:** bounded review brief → temporary run → structured result → acceptance commit → discard  
**Tech Stack:** provider router + context builder + artifact store; minimal capability pilot  
**Spec:** [execution](../../architecture/execution-and-recovery.md), [extensions](../../architecture/extensions-and-tools.md)

## เหตุผล

reviewer ไม่จำเป็นต้องแบกประวัติ worker ทั้งหมด การให้ brief ที่ตรงหน้าที่ลด context และช่วยตรวจจากชิ้นงานจริง แต่ fresh context หรือ provider คนละตัวไม่ได้รับประกันความถูกต้อง ต้องมี rubric และเครื่องมือตรวจที่เหมาะกับงาน

## Contracts

ReviewBrief: objective, acceptance_revision, artifact_revisions, selected_sources, allowed_tools, budget  
ReviewResult: verdict(PASS/REWORK/BLOCKED), findings, evidence_refs, checked_revision, unresolved_questions, recommended_next_action  
Finding: criterion_id, severity, observation, source_ref, reproduction_or_check

ไม่ต้องเก็บ hidden reasoning ของโมเดล เก็บเฉพาะข้อสรุป เหตุผลที่อธิบายได้ หลักฐาน และข้อจำกัด

## Work packages

### Temporary run and handoff

**Files:** src/review/review-session.ts, src/review/contracts.ts; tests/review/handoff.test.ts

- [ ] สร้าง temp workspace/context ที่มี run owner และ lifetime ชัดเจน
- [ ] ส่ง brief ที่อ้าง immutable artifact revision ไม่ใช่ path ที่ถูกแก้เงียบ
- [ ] validate ReviewResult schema และตรวจ evidence references
- [ ] commit accepted handoff ก่อน mark disposable
- [ ] crash ก่อน/หลัง handoff: resume validation หรือ cleanup ตาม receipt
- [ ] commit handoff protocol และ cleanup report

### Evidence-based checks

**Files:** src/review/validator.ts, src/capabilities/registry.ts, src/capabilities/artifact-reader.ts, src/capabilities/test-runner.ts; tests/review/validation.test.ts

- [ ] สร้าง rubric แยก criteria ที่ตรวจ deterministic กับ judgment
- [ ] artifact reader + bounded test runner ทำงานเฉพาะ test workspace ที่อนุญาต
- [ ] runner มี timeout/cancel/process-tree cleanup และ immutable output refs
- [ ] PASS ที่ไม่มี required evidence ถูกปฏิเสธ
- [ ] artifact เปลี่ยนหลัง review: verdict stale ต้องตรวจใหม่
- [ ] commit pilot capability contract และ role/tool permission tests

## Acceptance

| Scenario | ผลที่คาด |
| --- | --- |
| reviewer ตอบ PASS แต่ไม่แนบผล test ที่ rubric บังคับ | ไม่ผ่าน gate; ขอหลักฐานหรือ BLOCKED |
| reviewer พบ defect ที่ทำซ้ำได้ | REWORK อ้าง criterion + reproduction |
| run ตายก่อน result commit | task ยังไม่ผ่าน; temp data ไม่ถูกลบก่อน reconcile |
| run ตายหลัง result commit ก่อน cleanup | ผลคงอยู่; cleanup รันซ้ำได้ |
| discard session | working context หาย; report/evidence ที่อ้างยังอยู่ |
| reviewer พยายามอ่าน unit อื่นนอก scope | tool/runtime ปฏิเสธ |
| ผู้ใช้ยกเลิก review | ไม่มี run ใหม่ตื่น; child process ไม่ค้าง |

**Exit gate:** handoff/recovery/cleanup ผ่าน และ review ตัวอย่างหนึ่งพบ seeded defect ได้พร้อม evidence โดยไม่เห็น transcript worker ทั้งหมด
