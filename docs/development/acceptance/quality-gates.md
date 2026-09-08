# Quality Gates

เกณฑ์นี้เป็นข้อเสนอสำหรับการตรวจรับซอฟต์แวร์ ไม่ใช่ผลทดสอบปัจจุบัน ทุก phase ต้องมี tested SHA, environment, command, fixture/source, observed result และข้อจำกัดก่อนเปลี่ยนเป็น PASSED

## Gate register

| Gate | ตรวจอะไร | เกณฑ์ |
| --- | --- | --- |
| Q-CHAT | input/history/error/cancel | scenarios ขั้น 1 ผ่านทั้งหมด |
| Q-ROUTE | session continuity/capabilities | A → B → A, in-flight switch, unsupported payload ผ่าน |
| Q-DURABLE | commit/identity/state | duplicate ingress, transaction rollback, invalid transition ผ่าน |
| Q-RECOVER | crash/replay/cancel | fault matrix ด้านล่างผ่าน |
| Q-CONTEXT | budget/constraints/retrieval | dispatch budget ไม่เกิน, constraints 100%, fixed-source recall ตามแผน |
| Q-REVIEW | evidence/staleness/cleanup | PASS ไม่มีหลักฐานไม่ได้; discard แล้วหลักฐานอยู่ |
| Q-PROJECT | solo/parallel/wait/wake | objective loop จบตาม gate, stop มีผล, no lost wake |
| Q-GROUP | structure/sharing/handoff | no cycle/dual owner/leak/duplicate ticket |
| Q-LIFECYCLE | install/reset/update/uninstall | owned resources ตาม scope สะอาด, no old active runner |
| Q-BASELINE | เทียบ CNX ด้วยหลักฐาน | required items ไม่มี unexplained gap |
| Q-DOCS | ความครบ/ลิงก์/สถานะ | requirements map ครบ, local links ไม่เสีย, claims ตรง evidence |

## Fault-injection matrix

| Boundary | วิธีทดสอบ | Invariant |
| --- | --- | --- |
| ก่อน ingress commit | inject DB failure | no accepted ACK/no dispatch |
| หลัง commit ก่อน ACK | terminate process | replay คืน ticket เดิม |
| ก่อน/หลัง external dispatch | kill runner + fake provider receipt | classify not-sent/known/unknown ถูกต้อง |
| result ก่อน commit | drop connection/kill | ไม่สร้าง success จากข้อมูลที่ไม่ durable |
| หลัง result commit | restart | validate ต่อโดยใช้ result เดิม |
| success ก่อน delivery | restart UI/runner | ไม่ rerun model; delivery เดิม |
| ส่งผลแล้ว ACK หาย | replay outbox | UI/ปลายทางที่รองรับ dedupe แสดง logical delivery เดียว |
| lease takeover | ปล่อย old worker กลับมา | stale epoch commit/dispatch ไม่ได้ |
| cancel ทุก nonterminal state | cancel + restart | ไม่มีงานใหม่เกิดจาก ticket นั้น |
| update activation | kill ก่อน/หลัง generation switch | runner ปัจจุบันรายเดียว; reconcile งานค้าง |
| reset/cleanup | locked file/crash | ไม่รายงาน clean success ถ้ายังมี residue |

แต่ละ boundary ควรมี fixture ที่ควบคุมได้ และ representative actual-process test อย่างน้อยหนึ่งกรณี ผลจริงภายนอกที่ไม่รองรับ dedupe ต้องมี UNKNOWN/reconciliation ไม่แสร้งทดสอบได้ exactly-once ทุกปลายทาง

## Long-run qualification ขั้น 5

**Proposed minimum dataset/run:**

- synthetic workflow อย่างน้อย 200 ticket transitions และ raw history มากกว่า context budget 10 เท่า
- forced restart อย่างน้อย 5 จุด ครอบคลุม worker/review/controller/wait/delivery
- changed constraints อย่างน้อย 3 ครั้ง, stale artifacts 3 กรณี, seeded defect อย่างน้อย 1 กรณี
- serial run concurrency = 1 และ parallel fixture = 2
- actual provider run แบบมีงบจำกัดอย่างน้อย 20 role turns หรือจน objective ที่กำหนดเสร็จ โดยบันทึกจำนวนจริง
- idle/wait test ที่ไม่มี eligible work: LLM calls = 0; event มาถึงแล้วปลุกเพียง logical task ที่ควรปลุก

**Measures:** accepted criteria, required source recall, token counts per request, context manifest validity, repeated/no-progress work, recovery correctness, duplicate operations/deliveries, elapsed time, provider usage/cost ที่วัดได้ และ owned resource residue

ห้ามสรุปว่าทำงานได้ไม่จำกัดจาก soak test ช่วงเดียว รายงานระยะเวลา/จำนวน transitions/ขอบเขตที่วัดจริง เกณฑ์ประสิทธิภาพเวลาและ memory ตั้งจาก baseline บน hardware ที่ระบุ ไม่ใส่ตัวเลขเร็วสวยโดยไม่มี measurement

## Lifecycle qualification

ทดสอบใน disposable user/data root หรือ VM ตาม [lifecycle](../architecture/lifecycle-management.md) พร้อม inventory diff ก่อน/หลัง รวม services/tasks/child processes, registration, locks/ports, DB/artifacts, credentials ที่ Zooid เป็นเจ้าของ

Windows qualification ต้องเป็นผลจาก Windows จริง/VM ไม่ใช้ Linux test เป็นหลักฐานว่า PowerShell installer ผ่าน ส่วน OS อื่นเก็บ support matrix แยก

## Definition of done

- scope/acceptance ของ task ตรง intent ปัจจุบัน
- tests ตรวจ behavior ที่มีความเสี่ยงจริง และอ่านผลล่าสุดแล้ว
- change กับ evidence อ้าง code SHA เดียวกัน; ถ้ามี docs commit ทีหลังให้แยก tested SHA กับ report commit
- ไม่มี secrets ใน report/fixtures; external effects มี receipt หรือ uncertainty
- migration/lifecycle/permissions อัปเดตตาม resources ที่เพิ่ม
- STATUS/ACTIVE/report/next step เป็นข้อมูลตรงกัน
- code review ตามขนาดงาน; review ไม่แทนการรันทดสอบ

เอกสารชุดแรกตรวจเฉพาะ Q-DOCS ไม่มี application test หรือ qualification ใดถูกนับว่าผ่านจากการเขียนแผน
