# Requirements and Scope

## ระดับความแน่นอน

- **USER_DIRECTION:** ข้อสรุปจากผู้ใช้ ใช้เป็นข้อกำหนดออกแบบ
- **DESIGN_PROPOSAL:** รายละเอียดที่เสนอในเอกสารนี้ ปรับได้จากหลักฐาน
- **VERIFIED:** ผ่านการตรวจพร้อม revision และหลักฐานที่อ้างได้
- **NOT_IMPLEMENTED:** ยังไม่มี implementation แม้มีสัญญาหรือเกณฑ์ครบ

ทั้งหกขั้นอยู่ที่ NOT_IMPLEMENTED ณ วันที่ตั้งต้น การบันทึกแผนไม่เปลี่ยนสถานะ feature เป็น VERIFIED

## Requirements traceability

| ID | ข้อกำหนด USER_DIRECTION | เจ้าของรายละเอียด | ขั้นตรวจรับ |
| --- | --- | --- | --- |
| R-CHAT | เริ่มจาก provider และแชตพื้นฐาน | [Basic chat](phases/basic-provider-chat.md) | 1 |
| R-ROUTE | เปลี่ยน provider ใน session เดิม | [Routing](phases/provider-routing.md) | 2 |
| R-TICKET | มี ticket ก่อน recovery | [Tickets](phases/durable-tickets.md) | 3 |
| R-RECOVER | ฟื้นงานโดยไม่หลงสถานะ/ทำซ้ำไม่รู้ตัว | [Recovery](phases/recovery.md) | 4 |
| R-CONTEXT | งานยาวใช้ context ที่มีขอบเขต | [Bounded context](phases/context/bounded-context.md) | 5 |
| R-MEMORY | มีฐานข้อมูลเก็บสิ่งจำเป็นและที่มา | [Data](architecture/data-and-context.md) | 3–5 |
| R-REVIEW | session ชั่วคราวตรวจงานแล้วส่งคืนหลักฐาน | [Review](phases/context/ephemeral-review.md) | 5 |
| R-PROJECT | worker/reviewer/controller เดินงานใน Project | [Project](phases/context/project-runtime.md) | 5 |
| R-SOLO | provider/model เดียวใช้หลายบทบาทแบบสลับได้; ต้องรองรับการใช้ `qwen3.8:27b` ตัวเดียวแม้ inference ช้ามาก โดยไม่บังคับ helper model | [Execution](architecture/execution-and-recovery.md) | 2–5 |
| R-GROUP | ประสานหลายหน่วยและเลือกสิ่งที่แชร์ | [Group](phases/group-coordination.md) | 6 |
| R-RESHAPE | เพิ่ม ลด รวม แยก และเชื่อมระดับได้ | [Work units](architecture/work-unit-model.md) | 5–6 |
| R-LIFECYCLE | reset/uninstall/install-over/update สะอาด | [Lifecycle](architecture/lifecycle-management.md) | ทุกขั้นตาม resource ที่เพิ่ม |
| R-EXTEND | ผู้อื่นเพิ่ม skill และ tools ได้ | [Extensions](architecture/extensions-and-tools.md) | pilot ขั้น 5; ขยายภายหลัง |
| R-BASELINE | เทียบพื้นฐาน CNX ก่อนต่อยอด | [Baseline](acceptance/cogentnexus-baseline.md) | ก่อนปิด 4 และก่อนปิด 5 |
| R-CONTINUITY | สั่งเริ่มแล้วพัฒนาต่อพร้อมอัปเดตงาน | [Handoff](guides/development-handoff.md) | workflow ผู้พัฒนา |
| R-NAMING | โฟลเดอร์อังกฤษ ชื่อไฟล์มีความหมายไม่มีรุ่น | [Naming](guides/naming-and-documentation.md) | เอกสารและโค้ด |

## ข้อเสนอ implementation ที่ต้องพิสูจน์

เสนอ TypeScript + Node.js สำหรับ CLI/core เพื่อให้เชื่อมกับกระบวนการพัฒนาฝั่ง OpenClaw ได้สะดวก และ SQLite สำหรับ durable state ตั้งแต่ขั้น 3 ข้อเสนอนี้ไม่อ้างว่าได้ตรวจ toolchain ของเครื่องผู้ใช้แล้ว

งานเตรียมขั้น 1 ต้องเปรียบเทียบกับ Python ในเรื่อง packaging, shell integration, cancellation, dependency size และความถนัดผู้ดูแล เลือกเพียงหนึ่ง stack แล้วบันทึกเหตุผล/รุ่นที่ทดสอบจริง ก่อนสร้าง production code เส้นทาง .ts ในแผนเป็น proposed file map ถ้าเลือกต่างออกไปต้องแก้ map ให้ตรงกันก่อนลงมือ

## ขอบเขตเริ่มต้น

- Local-first, ผู้ใช้เดียว, เครื่องเดียว; CLI เป็น interface แรกที่เสนอ
- Text chat, manual provider switching, persistence ของงานในเครื่อง
- Single-model operation เป็น baseline; โมเดลเล็ก/หลายโมเดลเป็น optional optimization ไม่ใช่ dependency
- ต้องรองรับ slow-model mode ที่ timeout ปรับได้และไม่ถือว่าความช้าเพียงอย่างเดียวคือ failure
- ไม่ตั้ง daemon หรือ scheduled task ในขั้น 1
- ไม่มีข้อบังคับให้รองรับทุก provider protocol ในครั้งแรก
- ไม่มี bot fleet, billing, cloud orchestration หรือ cross-machine consensus ใน baseline
- Windows/PowerShell เป็นเป้าหมายเครื่องผู้ใช้; ระบุ support matrix จากการทดสอบจริง ไม่อ้าง cross-platform โดยอัตโนมัติ
- การติดตั้งข้าง Hermes ไม่ใช่แกน acceptance อีกต่อไป แต่ไม่มีสิทธิ์แก้หรือลบ resource ที่ Zooid ไม่ได้เป็นเจ้าของ

## ความเสี่ยงหลักและวิธีลด

| ความเสี่ยง | วิธีลดและสัญญาณที่ต้องตรวจ |
| --- | --- |
| ออกแบบใหญ่เกินจนไม่เกิดของใช้ | ปิดแต่ละ phase ด้วย demo/acceptance; จำกัด dependency |
| เปลี่ยน provider แล้วข้อมูลหาย | capability negotiation และ explicit rejection |
| retry สร้างผลภายนอกซ้ำ | operation identity, receipt, UNKNOWN outcome และ reconciliation |
| สรุปแล้วลืมข้อกำหนด | pinned constraints + source refs + retrieval evaluation |
| reviewer เห็นพ้องกับ worker โดยไม่มีหลักฐาน | rubric, independent test, fresh context, deterministic gate |
| งานวนไม่คืบ | progress signal, attempt/budget limit, blocked reason |
| reset ลบผิด/อัปเดตซ้อน | ownership manifest, generation fence, dry-run และ crash matrix |
| เอกสารกลายเป็นสถานะเท็จ | แยก design/status/evidence และอ้าง tested SHA |
