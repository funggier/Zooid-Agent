# Development Plan

เอกสารนี้เป็นจุดเริ่มต้นของแผนสร้าง Zooid ใหม่ ครอบคลุมเหตุผล องค์ประกอบ ลำดับงาน ขอบเขตข้อมูล การตรวจรับ และการส่งต่องานให้ผู้พัฒนาหรือ CogentNexus-OpenClaw

**สถานะ:** DESIGN_DOCUMENTED / IMPLEMENTATION_NOT_STARTED  
**วันที่ตั้งต้น:** 2026-09-08  
**Repository:** [funggier/Zooid-Agent](https://github.com/funggier/Zooid-Agent)

## อ่านตามลำดับ

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
| [Status](coordination/STATUS.md) / [Active](coordination/ACTIVE.md) / [Worklog](coordination/WORKLOG.md) | ตอนนี้อยู่ตรงไหน |

## แผนรายขั้น

1. [Basic provider chat](phases/basic-provider-chat.md)
2. [Provider routing](phases/provider-routing.md)
3. [Durable tickets](phases/durable-tickets.md)
4. [Recovery](phases/recovery.md)
5. [Context and Project](phases/context-and-project.md)
6. [Group coordination](phases/group-coordination.md)

ขั้นที่ 5 มีแผนย่อย: [durable knowledge](phases/context/durable-knowledge.md), [bounded context](phases/context/bounded-context.md), [ephemeral review](phases/context/ephemeral-review.md), [Project runtime](phases/context/project-runtime.md)

## วิธีตีความแผน

เอกสารชุดนี้เป็น product/architecture plan พร้อม work packages และ acceptance scenarios ไม่ใช่คำยืนยันว่า feature ทำงานแล้ว ส่วนที่เป็นข้อเสนอทางเทคนิคระบุไว้ชัดเจน และจะยืนยันด้วยงานทดลองที่มีเกณฑ์ตัดสินก่อนผูกกับ dependency จริง

ทุกขั้นต้องได้ชิ้นงานที่ใช้งานได้ในขอบเขตของตน ไม่ต้องสร้างโครงสร้างขั้นสุดท้ายทั้งหมดก่อนแชตครั้งแรก งานถัดไปที่พร้อมเตรียมคือ [prepare-basic-chat](tasks/prepare-basic-chat.md) การพัฒนาโปรแกรมเริ่มเมื่อผู้ใช้สั่ง

## Templates

- [Task](templates/task.md)
- [Report](templates/report.md)
- [Decision](templates/decision.md)
- [Reports directory](reports/README.md)
