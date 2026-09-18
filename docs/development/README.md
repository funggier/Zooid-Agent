# Development Plan

เอกสารนี้เป็นศูนย์กลางแผนและประวัติการพัฒนา Zooid ครอบคลุมเหตุผล องค์ประกอบ ลำดับงาน ขอบเขตข้อมูล การตรวจรับ และ durable handoff

**สถานะ:** IMPLEMENTATION_IN_PROGRESS  
**วันที่ตั้งต้น:** 2026-09-08  
**Implementation เริ่ม:** 2026-09-18  
**Repository:** [funggier/Zooid-Agent](https://github.com/funggier/Zooid-Agent)

## เริ่มอ่านเมื่อรับช่วงงาน

1. [Active work](coordination/ACTIVE.md)
2. [Development status](coordination/STATUS.md)
3. [Numbered task ledger](tasks/README.md)
4. task/report ล่าสุดที่ ACTIVE อ้างถึง
5. phase/architecture/acceptance ที่เกี่ยวข้อง

## เอกสารหลัก

| เอกสาร | ใช้ตอบคำถาม |
| --- | --- |
| [Vision and rationale](vision-and-rationale.md) | ทำไมสร้างใหม่ และกำลังแก้ปัญหาอะไร |
| [Requirements and scope](requirements-and-scope.md) | สิ่งใดเป็นความต้องการ สิ่งใดเป็นข้อเสนอ |
| [Roadmap](roadmap.md) | ทำอะไรก่อนหลัง และจบแต่ละขั้นเมื่อใด |
| [System architecture](architecture/system-overview.md) | ส่วนต่าง ๆ ติดต่อกันอย่างไร |
| [Work units](architecture/work-unit-model.md) | Session, Project, Group เปลี่ยนโครงสร้างได้อย่างไร |
| [Data and context](architecture/data-and-context.md) | เก็บอะไร ดึงอะไรเข้า context และเชื่ออะไร |
| [Execution and recovery](architecture/execution-and-recovery.md) | งานเดินต่อ ตรวจรับ หยุด และฟื้นอย่างไร |
| [Lifecycle](architecture/lifecycle-management.md) | ติดตั้ง รีเซ็ต ถอน ลงทับ และอัปเดตอย่างสะอาด |
| [Extensions](architecture/extensions-and-tools.md) | skill, tool, plugin และ MCP เข้ามาตรงไหน |
| [Decisions](decisions/design-decisions.md) | ตัดสินใจอะไรแล้ว และต้องทดลองอะไรอีก |
| [Acceptance](acceptance/quality-gates.md) | หลักฐานแบบใดจึงถือว่าผ่าน |
| [CNX baseline](acceptance/cogentnexus-baseline.md) | เทียบผลลัพธ์กับระบบเดิมโดยไม่คัดลอกข้อสันนิษฐาน |
| [Handoff](guides/development-handoff.md) | ผู้พัฒนาเริ่มและส่งต่องานอย่างไร |
| [Naming](guides/naming-and-documentation.md) | ตั้งชื่อและรักษาเอกสารอย่างไร |
| [Worklog](coordination/WORKLOG.md) | timeline checkpoint สำคัญ |

## แผนรายขั้น

1. [Basic provider chat](phases/basic-provider-chat.md) — foundation verified; live provider pending
2. [Provider routing](phases/provider-routing.md)
3. [Durable tickets](phases/durable-tickets.md)
4. [Recovery](phases/recovery.md)
5. [Context and Project](phases/context-and-project.md)
6. [Group coordination](phases/group-coordination.md)

ขั้นที่ 5 มีแผนย่อย: [durable knowledge](phases/context/durable-knowledge.md), [bounded context](phases/context/bounded-context.md), [ephemeral review](phases/context/ephemeral-review.md), [Project runtime](phases/context/project-runtime.md)

## Task ↔ Branch model

Branch เป็น execution workspace ส่วน task/report เป็น durable project memory

ค่าเริ่มต้น:

`ZOOID-xxxx semantic task <-> agent/zooid-xxxx-semantic-branch`

เมื่อ task เสร็จ branch อาจ merge/delete ได้ แต่ task/report ต้องคงอยู่ใน Git history/main. Task number ไม่ใช่ release version.

## Current implementation evidence

[ZOOID-0001](tasks/ZOOID-0001-basic-chat-foundation.md) สร้าง runnable fake-provider chat foundation และผ่าน GitHub Actions บน Ubuntu/Windows ที่ implementation SHA `0da31b465846823cb09b8b64bfa48ca5879e0c58`.

งานถัดไปยังอยู่ใน Basic Provider Chat: first real provider configuration/adapter qualification.

## Templates

- [Task](templates/task.md)
- [Report](templates/report.md)
- [Decision](templates/decision.md)
- [Reports directory](reports/README.md)
