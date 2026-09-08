# CogentNexus-OpenClaw Baseline

## วัตถุประสงค์

ผู้ใช้ต้องการให้ Zooid ได้พื้นฐานระดับเดียวกับงานที่ทำใน CogentNexus-OpenClaw ก่อนพัฒนาต่อยอด ตารางนี้เป็นรายการผลลัพธ์ที่ต้องสำรวจและนำมาเทียบ ไม่ใช่คำยืนยันว่า CNX รุ่นปัจจุบันมีทุกอย่างแล้ว

แหล่งเริ่มตรวจคือ [funggier/CogentNexus-OpenClaw](https://github.com/funggier/CogentNexus-OpenClaw) ต้อง resolve repository/branch/commit จริงตอนทำ baseline ไม่ใช้ชื่อ release จากความทรงจำหรือข้อความสนทนาแทนหลักฐาน

## Baseline register

| Capability ที่ต้องสำรวจ | หลักฐานฝั่ง CNX ที่ต้องหา | Zooid gate | สถานะปัจจุบัน |
| --- | --- | --- | --- |
| ingress/ticket identity | handler + duplicate-ingress tests | Q-DURABLE | NOT_EVALUATED |
| durable state/event ordering | schema/transaction tests | Q-DURABLE | NOT_EVALUATED |
| provider error/fallback semantics | route/attempt trace | Q-ROUTE/Q-RECOVER | NOT_EVALUATED |
| crash/restart recovery | fault-injection report + tested SHA | Q-RECOVER | NOT_EVALUATED |
| delivery acknowledgement/replay | outbox/ACK tests | Q-RECOVER | NOT_EVALUATED |
| side-effect dedupe/reconciliation | operation receipt + unknown outcome test | Q-RECOVER | NOT_EVALUATED |
| terminal-state validation | validator + failing-artifact test | Q-REVIEW | NOT_EVALUATED |
| single-model scheduling/budgets | scheduler + serial run evidence | Q-PROJECT | NOT_EVALUATED |
| user stop/wait/continuation | persisted cancel/wake tests | Q-PROJECT | NOT_EVALUATED |
| install-over/reset/uninstall/update | ownership manifest + lifecycle report | Q-LIFECYCLE | NOT_EVALUATED |
| context/checkpoint continuity | source-linked checkpoint tests | Q-CONTEXT | NOT_EVALUATED |

## วิธีทำ baseline audit

1. resolve repo, default branch, target revision และ instructions จาก source จริง
2. บันทึก source path + commit permalink ของ implementation และ acceptance test
3. แยก IMPLEMENTED, TESTED, DOCUMENTED_ONLY, NOT_FOUND และ NOT_APPLICABLE
4. reproduce behavior ที่จำเป็นใน environment แยกที่ได้รับอนุญาต; ไม่แก้ live CNX ระหว่างสำรวจ
5. map กับ Zooid test และผล observed; ไม่เทียบแค่ชื่อ feature
6. gap แต่ละรายการมี severity, phase owner และ required/deferred decision
7. บันทึก report ที่ reference CNX SHA และ Zooid tested SHA ทั้งคู่

ไม่ใช้ “NOT_FOUND” แทน “ไม่มี” จนตรวจ scope ชัด และไม่ถือว่า Zooid ผ่านเพราะ CNX ยังไม่มี test รายการนั้น เกณฑ์ของ Zooid ตามเจตนาผู้ใช้ยังต้องตรวจเอง

## Milestones

- ก่อนปิดขั้น 4: execution/ticket/recovery/delivery/lifecycle ที่เกี่ยวข้องต้องมี baseline assessment
- ก่อนปิดขั้น 5: context/scheduling/validation/continuation และช่องว่างพื้นฐานที่จัดเป็น required ต้องปิด
- ถ้าพบ requirement ที่ต้องมาก่อน phase ปัจจุบัน ให้แก้ dependency/roadmap พร้อมเหตุผล ไม่ข้าม gate เพื่อรักษาตารางเดิม

ปัจจุบันไม่มีการ audit source ของ CNX ในงานจัดทำเอกสารชุดนี้ และยังไม่มีผลเทียบเท่าที่อ้างได้
