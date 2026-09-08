# Naming and Documentation

## ชื่อ

- โฟลเดอร์ภาษาอังกฤษ เช่น docs/development, architecture, phases, acceptance, coordination
- ไฟล์ lowercase kebab-case ที่บอกเนื้อหา เช่น provider-routing.md, lifecycle-management.md
- ไม่ใช้ phase-v1.md, plan-v2-final.md หรือ zooid-0.1-roadmap.md
- README.md, AGENTS.md, STATUS.md, ACTIVE.md, WORKLOG.md ใช้ชื่อ convention เพื่อค้นพบง่าย
- หมายเลข phase เป็นลำดับในเนื้อหา ไม่ใช่ version suffix ของชื่อไฟล์
- schema migration ใช้ semantic name และมี order/checksum ใน registry ไม่ทำให้ลำดับการรันคลุมเครือ

## Metadata และความจริงของเอกสาร

วันที่ revision, runtime version, source SHA, status และ owner อยู่ในเนื้อหา Git เก็บประวัติการเปลี่ยนแปลง ไม่ทำสำเนาไฟล์หลายรุ่นเพื่อเก็บประวัติ

USER_DIRECTION, DESIGN_PROPOSAL, VERIFIED, NOT_IMPLEMENTED มีความหมายตาม [requirements](../requirements-and-scope.md) ถ้าทดสอบไม่ได้ให้บอกเหตุผลและสิ่งที่ยังไม่ทราบ ห้ามแทนด้วย “น่าจะผ่าน”

## รูปแบบแผน

แต่ละ phase มี goal, architecture, stack status, spec links, เหตุผล, components/contracts, work packages, file responsibilities, acceptance scenarios และ exit gate

ก่อนลง implementation ของ work package ต้องเติม exact dependency versions และ runnable test commands จาก stack จริงใน task ของมัน ไม่ใช้คำสั่งที่ยังไม่มีเป็นหลักฐาน

## การรักษาความเชื่อมโยง

ใช้ relative links ภายใน repo และ commit permalinks เมื่ออ้างหลักฐานจาก source revision เฉพาะ เมื่อย้ายไฟล์ให้แก้ inbound links ใน change เดียวกัน

report ใช้ชื่ออธิบายผล เช่น basic-chat-qualification.md แล้วแก้ตาม Git history; หากเป็นการทดลองคนละเรื่องให้ตั้งชื่อตามสมมติฐาน เช่น provider-cancellation-comparison.md

## Source and attribution

การยืม code/skill/dependency ให้บันทึก repository, path, revision, เงื่อนไขใช้และ notices ที่เกี่ยวข้อง ตรวจตามชิ้นส่วนจริง ไม่ถือว่าการสร้าง repo ใหม่ลบ provenance ของสิ่งที่นำมาใช้

README ของโครงการต้องแสดงสถานะใช้งานจริง ไม่เขียน feature เป้าหมายเหมือนติดตั้งแล้วใช้ได้ทันที
