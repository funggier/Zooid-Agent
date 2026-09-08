# Design Decisions

เอกสารนี้แยกข้อสรุปผู้ใช้กับรายละเอียดที่เสนอ เพื่อให้เริ่มพัฒนาต่อได้โดยไม่สร้างความแน่นอนเทียม

## Decisions register

| ID | สถานะ | การตัดสินใจและเหตุผล | ผลกระทบ/เวลาทบทวน |
| --- | --- | --- | --- |
| D-ORIGIN | USER_DIRECTION | สร้างใหม่ใน repo ปัจจุบัน; ใช้ระบบเดิมเป็น reference | ไม่ยก fork tree และ independence audit มาตั้งต้น |
| D-SEQUENCE | USER_DIRECTION | Chat, Router, Ticket, Recovery, Context/Project, Group | feature เพิ่มต้องอ้าง phase และ gate |
| D-UNIT | USER_DIRECTION | ระดับเป็นรูปแบบ Work Unit ที่ปรับได้ | identity/provenance ต้องไม่ผูกกับชื่อระดับ |
| D-CLEAN | USER_DIRECTION | lifecycle สะอาดเป็นแกน | resource ใหม่ต้องมี cleanup/recovery plan |
| D-SOLO | USER_DIRECTION | หนึ่ง model ทำหลายบทบาทได้ | scheduler serial เป็น baseline |
| D-EPHEMERAL | USER_DIRECTION | ใช้ temporary session โดยเฉพาะ review | ต้องรับผล/evidence ก่อน discard |
| D-CNX | USER_DIRECTION | เรียนรู้/เทียบพื้นฐาน CNX และให้ช่วยพัฒนา | ต้องตรวจ repo revision จริงก่อนอ้างเทียบเท่า |
| D-STACK | DESIGN_PROPOSAL | TypeScript + Node.js; เทียบ Python ก่อนเลือก | ตัดสินใน prepare-basic-chat ด้วย packaging/cancel spike |
| D-STORE | DESIGN_PROPOSAL | SQLite + artifact files ตั้งแต่ ticket | ทดสอบ transactions, restore, locking บนเครื่องเป้าหมายก่อนขั้น 3 |
| D-DEPLOY | DESIGN_PROPOSAL | modular monolith, local-first | แยก process/service เมื่อมี boundary ที่พิสูจน์แล้ว |
| D-OWNERSHIP | DESIGN_PROPOSAL | ownership forest + collaboration graph | ทดสอบ reshape race ก่อน Project/Group |
| D-RETRIEVAL | DESIGN_PROPOSAL | metadata/lexical ก่อน vector | เพิ่ม vector เมื่อ benchmark ชี้ประโยชน์ที่วัดได้ |
| D-REVIEW | DESIGN_PROPOSAL | rubric + deterministic evidence gate | fresh reviewer ไม่รับประกันความจริง |
| D-UPDATES | USER_DIRECTION | Zooid มี release/update ของตัวเอง | ไม่ auto-sync upstream; imports review รายส่วน |
| D-MONETIZE | DEFERRED_BY_USER | พักเรื่องรายได้ | ไม่เพิ่ม billing ใน roadmap ปัจจุบัน |

## การทดลองก่อนล็อกเทคโนโลยี

| คำถาม | วิธีตัดสิน | เงื่อนไขที่ต้องบันทึก |
| --- | --- | --- |
| TypeScript หรือ Python | CLI prototype ส่ง/ยกเลิก mock request และ clean package ใน temp root | dependency list, startup, cancellation, installed residue; เลือกตัวที่ผ่านและผู้ดูแลรักษาได้ |
| Provider แรก | ใช้ provider ที่ผู้ใช้ตั้งค่าได้จริงและ protocol รองรับ text | credentials ตรวจโดยไม่แสดงค่า; mock tests ก่อน live opt-in |
| SQLite driver | transaction/lock/crash/backup fixtures บน runtime/OS ที่เลือก | exact versions, native dependency footprint, migration behavior |
| Token accounting | ทดสอบ pack ที่ขอบ model window กับ adapter fixture | estimation method, overhead, rejection behavior |
| Background runner | ทดสอบ wait/wake/restart/stop ใน environment แยก | ไม่มี lost wake, ไม่มี old runner, idle ไม่เรียกโมเดล |
| License สำหรับการเผยแพร่ | เจ้าของโครงการเลือกรูปแบบก่อน public distribution ของ code/package | บันทึก license file และ dependency notices; ไม่สมมติจาก repo เดิม |

## การเปลี่ยน decision

บันทึก problem, alternatives, decision, consequences, evidence และข้อที่ supersede ตาม [template](../templates/decision.md) แก้ roadmap/acceptance ที่เกี่ยวข้องใน change เดียวกัน ไม่สร้างไฟล์ชื่อ decision-v2 หรือทำสำเนาแผนหลายรุ่นจนไม่รู้ฉบับหลัก

ไม่กำหนด framework/database ขั้นสูงเพียงเพราะมองเป้าหมายใหญ่ หาก prototype เรียบง่ายผ่าน contract ให้คงแนวทางนั้นและขยายเมื่อพบข้อจำกัดจริง
