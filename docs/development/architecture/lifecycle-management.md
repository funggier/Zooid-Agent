# Clean Lifecycle Management

**ความสำคัญ:** เป็นเงื่อนไขคุณภาพหลักของ Zooid ไม่ใช่งานเก็บกวาดหลัง feature เสร็จ

## Ownership inventory

ทุก resource ที่สร้างต้องมี owner และวิธีคืนสภาพก่อนเพิ่ม feature นั้น: install root, data/config/cache/log roots, DB/artifacts, credential reference, process tree, service/task, shell registration, shortcut, IPC/port และ updater staging

Manifest ต้องบันทึก installation_id, install_generation, canonical paths, resource type, creation receipt, cleanup handler และ compatibility metadata ไม่เชื่อ path จาก manifest โดยไม่ตรวจ: ต้องป้องกัน path traversal และ junction/symlink ที่พาออกนอก owned root

ตัวอย่าง proposed roots บน Windows: code ใต้ user-selected install root, data ใต้ user-selected data root; เลือกค่าจริงในงาน packaging และทดสอบ path ที่มีช่องว่าง/ภาษาไทย หลีกเลี่ยงการผูก path ลง source

## Semantics ของคำสั่ง

| คำสั่ง | ผลที่สัญญา | สิ่งที่ต้องแสดงและพิสูจน์ |
| --- | --- | --- |
| reset settings | คืน config ตาม default | แสดงว่าประวัติ/credentials ถูกเก็บหรือไม่ |
| reset data | ล้างงาน/ประวัติ/derived data ใน scope | หยุด writer, ล้าง DB/artifacts/cache ที่อ้างกัน |
| reset all | กลับ first-run state ของ Zooid | ล้าง credential ที่ Zooid เป็นเจ้าของ; ไม่มี job เก่าตื่น |
| uninstall keep-data | เอา runtime/registrations ออก | แจ้ง retained data paths อย่างชัดเจน |
| uninstall purge | ถอน owned runtime/data/config/credentials | zero owned active process/task/service; inventory residue report |
| install-over | แทน runtime ของ installation เดิม | data compatibility checked; runtime generation เดียว |
| update | สลับไป release ของ Zooid | no old worker dispatch, migration verified, health checked |

uninstall keep-data ไม่เรียกว่า “เหมือนไม่เคยติดตั้ง” คำสัญญา clean purge ครอบคลุม resource ที่ Zooid เป็นเจ้าของ ไม่ครอบคลุม system event logs, OS backups หรือไฟล์ export ที่ผู้ใช้เก็บไว้ภายนอก และไม่รับประกัน forensic secure erase

## Lifecycle transaction

1. **Preflight:** inventory, permissions, disk space, active jobs, schema compatibility และ dry-run
2. **Quiesce:** ปิด ingress/การ claim ใหม่ บันทึก intent ของ update/reset และหยุด scheduler
3. **Drain/reconcile:** รอหรือยุติ active work ตาม policy บันทึก UNKNOWN ของผลที่ยังพิสูจน์ไม่ได้
4. **Prepare:** ตรวจ package hash/source, staging และ consistent backup ตาม scope
5. **Apply:** migration/replace/cleanup ด้วย operation journal ที่รันซ้ำได้
6. **Activate:** เพิ่ม generation, เปิด runtime เดียว, ทดสอบ health และ compatibility
7. **Verify/commit:** ตรวจ old processes/tasks/locks/ports, commit receipt แล้วเก็บกวาด staging
8. **Recover failure:** ใช้ journal ตัดสิน resume หรือ rollback ไม่เดาว่าขั้นก่อนสำเร็จ

Updater ติดตาม release channel ของ Zooid เท่านั้น การนำแนวคิด/โค้ดจาก Hermes มาใช้เป็นงานพัฒนาที่ review รายส่วน ไม่มี runtime auto-sync upstream

## Update consistency

application version, installation generation, lease epoch และ schema version เป็นคนละค่า Runtime ต้องเข้ากันได้กับ schema และถือ generation/epoch ปัจจุบัน ไม่กำหนดให้เลขทุกประเภทเท่ากัน

การ rollback code ใช้ได้เมื่อ schema ยังเข้ากัน ถ้ามี irreversible migration ต้อง restore snapshot ที่เข้ากันพร้อมแจ้งข้อมูลหลัง snapshot ที่ต้อง reconcile ก่อนดำเนินงานต่อ ไม่ย้อนผลภายนอกโดยสมมติว่าการคืน DB ยกเลิกผลนั้นแล้ว

## Incremental delivery

- ขั้น 1: resource paths ชัด, config/history cleanup ใน test root, ไม่มี service registration
- ขั้น 2: credential references ของหลาย provider มี owner ชัด
- ขั้น 3: DB/artifact backup, reset และ migration receipt
- ขั้น 4: drain/recovery/update fencing; outbox ไม่ถูกปลุกซ้ำจาก runner เก่า
- ขั้น 5: ephemeral storage, retrieval index, background runner และ plugin processes เข้า inventory
- ขั้น 6: pending handoff/membership เข้า drain และ cleanup

ก่อนแจก installer หรือ updater ต้องผ่าน lifecycle qualification ไม่ใช้ผู้ใช้จริงเป็นที่ทดสอบ destructive cleanup

## Acceptance matrix

ทดสอบ fresh install → chat → install-over → update → reset all → reopen → uninstall purge → reinstall พร้อม snapshot inventory ก่อน/หลัง

แทรก crash ระหว่าง quiesce, migration, activation และ cleanup; ทดสอบ locked files, read-only paths, insufficient space, interrupted download, duplicate installer invocation และ reboot ที่ task เก่าอาจกลับมา

ผ่านเมื่อมี runtime ที่รับงานได้เพียง generation ปัจจุบัน ไม่มี owned service/task/process เหลือหลัง purge ไม่มีข้อมูลเก่ากลับมาหลัง reset และการทำคำสั่งซ้ำไม่สร้างความเสียหายเพิ่ม รายการที่ลบไม่ได้ต้องแสดงและไม่รายงาน clean success
