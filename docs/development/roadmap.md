# Development Roadmap

ลำดับที่ผู้ใช้กำหนดคือ Chat → Router → Ticket → Recovery → Context/Project → Group ไม่มีหมายเลขรุ่นผูกกับชื่อเอกสาร และไม่กำหนดวันเสร็จจากการคาดเดา

## Phase map

| ขั้น | ผลลัพธ์ที่ผู้ใช้สัมผัสได้ | องค์ประกอบหลัก | เกณฑ์ออกจากขั้น |
| --- | --- | --- | --- |
| 1 [Chat](phases/basic-provider-chat.md) | เปิดแล้วคุยกับ provider เดียวได้ | CLI, config, adapter, message history, cancellation | แชต/ผิดพลาด/หยุด/ปิดและเปิดประวัติได้ |
| 2 [Router](phases/provider-routing.md) | สลับ provider ใน session เดิม | registry, capabilities, neutral transcript, routing record | สลับสอง adapter ได้ ไม่มี silent history loss |
| 3 [Ticket](phases/durable-tickets.md) | เห็นงานและสถานะที่บันทึกจริง | SQLite, ticket, attempt, ledger, result, delivery | commit ก่อนส่งงาน; duplicate ingress ไม่สร้างงานใหม่ |
| 4 [Recovery](phases/recovery.md) | กลับมาทำต่อหลังขัดข้องได้ | lease, reconcile, outbox, retry, cancellation | fault injection ผ่านและ unknown outcome ไม่ถูก replay มั่ว |
| 5 [Context/Project](phases/context-and-project.md) | งานยาวใช้หลายบทบาทจนตรวจรับได้ | evidence store, context builder, ephemeral review, scheduler | context bounded + Project loop + baseline |
| 6 [Group](phases/group-coordination.md) | ประกอบ/แยกหลายหน่วยเป็นงานร่วม | membership, scoped exchange, budgets, dependencies | attach/detach/reshape โดยไม่เสีย identity หรือสิทธิ์ |

## ขั้น 5 แบ่งย่อย

| ส่วน | ชิ้นงานอิสระ | จุดทดสอบ |
| --- | --- | --- |
| 5A | ข้อกำหนด context และข้อมูลจริง | ข้อกำหนดไม่หายเมื่อสร้าง snapshot |
| 5B | durable knowledge และ schema evolution | rebuild projection ได้จากหลักฐาน |
| 5C | context builder ที่จำกัดงบ | สลับ model window แล้วไม่เกินขนาด |
| 5D | retrieval, summary, rehydration | ตอบจากข้อมูลเก่าได้และแสดงที่มา |
| 5E | ephemeral session และ fresh review | ลบทิ้งหลังผลรับแล้ว; ผลไม่ครบไม่ผ่าน |
| 5F | Project scheduler แบบ serial | worker → review → controller → next |
| 5G | bounded parallelism และ long-run qualification | same-task race, restart, wait/wake, cancellation |

5G ต้องพิสูจน์ concurrency แบบจำกัดเป็นตัวเลือก ส่วน Group หลายเครื่องไม่อยู่ในขั้นนี้ Serial mode ยังเป็น baseline ที่ต้องรักษา

## งานข้ามทุกขั้น

- Lifecycle เริ่มจาก inventory ของ path/config ในขั้น 1; เพิ่ม DB ในขั้น 3, runner ในขั้น 4/5 และ extension resources เมื่อเริ่มใช้
- ใช้ test ที่ตรวจ behavior และ failure boundary; ทุก phase มี evidence report
- สำรวจ CNX revision จริงก่อนอ้างว่าเทียบเท่า; ช่องว่างที่จำเป็นต้องปิดก่อนประกาศ baseline ผ่าน
- เขียน ADR เมื่อเปลี่ยนสัญญาที่กระทบข้อมูล ผู้ใช้ หรือขอบเขต phase
- ไม่เพิ่ม feature ขั้นถัดไปเพื่อหลีกเลี่ยงการแก้ gate ของขั้นปัจจุบัน

## Release และการเริ่มงาน

ขั้น 1 เริ่มจาก development checkout ที่สะอาด การแจก installer/updater ต้องผ่าน lifecycle suite ก่อน แม้ feature แชตจะพร้อมแล้วก็ตาม การมี phase ที่ผ่านไม่ได้แปลว่า distributable release พร้อมอัตโนมัติ

สถานะเริ่มต้นคือเอกสารพร้อมให้ใช้วางงาน ส่วน implementation รอคำสั่งเริ่ม เมื่อเริ่มแล้วให้ทำ task ที่พร้อมตาม dependency และรายงาน checkpoint ไปเรื่อย ๆ ตาม [handoff](guides/development-handoff.md)

ก่อนเริ่มแต่ละขั้น ให้ยืนยัน interface/schema และแตก work package ในเอกสาร phase เป็น task ที่มี exact file map, test command และ expected result ตาม stack ที่เลือก รายละเอียดของทุก phase มีขอบเขตงานและ acceptance แล้ว; การ pin dependency หรือเขียนโค้ดทดสอบจริงทำใกล้เวลาพัฒนาเพื่อไม่ล็อกสิ่งที่ยังไม่ทดลอง
