# Development Handoff

## จุดประสงค์

ให้ผู้พัฒนาหรือ CogentNexus-OpenClaw ในเครื่องผู้ใช้รับงานต่อได้จาก repository โดยไม่ต้องอ่านแชตทั้งหมด เอกสารนี้เป็น workflow ผู้พัฒนา ไม่ใช่ runtime scheduler ของ Zooid

## เริ่ม session ทำงาน

1. ยืนยันว่า checkout ชี้ repository ใหม่ funggier/Zooid-Agent; อย่าใช้ working copy ของ fork เดิมเพียงเพราะชื่อโฟลเดอร์เหมือนกัน
2. อ่าน root AGENTS.md, development README, STATUS, ACTIVE และ phase/task ที่จะทำ
3. ตรวจ Git branch/head/working tree และ instructions ใน subtree ที่แตะ
4. ตรวจว่าคำสั่งผู้ใช้อนุญาต documentation หรือ implementation และขอบเขตถึงไหน
5. เลือก task ที่ dependency ผ่าน; เริ่มที่ prepare-basic-chat เมื่อเริ่ม implementation ครั้งแรก
6. claim owner/branch/base SHA/next checkpoint ด้วย conflict-aware Git update แล้วอ่านกลับก่อนลงมือ

CNX-OpenClaw ใช้เป็น execution host ได้เมื่อมี tool access ในเครื่องนั้น Zooid source/config/data/test root ต้องไม่ปะปนกับ live OpenClaw/CNX การมีเอกสารนี้ไม่ติดตั้ง watcher หรือส่งคำสั่งไปเครื่องผู้ใช้อัตโนมัติ

## วงจรงานเมื่อผู้ใช้สั่งเริ่มแล้ว

อ่าน checkpoint → เลือก ready task → ลงมือในขอบเขตที่ได้รับอนุญาต → ทดสอบตาม gate → ตรวจงาน → commit/report → อัปเดต checkpoint → เลือก task ถัดไป

ส่ง progress update สั้นเมื่อมีผลสำคัญหรือเปลี่ยนทิศทาง ไม่ต้องขอ “ทำต่อไหม” เมื่อเป็นงานถัดไปภายใน scope เดิม คำถามที่จำเป็นต้องระบุสิ่งที่ขาดและผลกระทบ เช่น credential/provider ที่ไม่มีหรือการตัดสินใจที่มีผลต่อข้อมูลผู้ใช้

เมื่อจบ authorized scope ให้รายงานผลและข้อจำกัด ไม่ขยายจาก Chat ไปถึง Group เองถ้าผู้ใช้สั่งเพียง Chat

## Durable checkpoint

ACTIVE ต้องบอก task, owner, branch, base/head SHA, last verified action, next action, remaining risks, evidence report และสิ่งที่รอ ไม่ใช้ “กำลังทำต่อ” เป็น checkpoint ทั้งหมด

STATUS เป็นภาพ phase/task; WORKLOG เป็นเหตุการณ์สำคัญ; report เก็บรายละเอียดทดสอบและ decision อย่าเก็บ raw transcript หรือ token log ทั้งหมดในทุกไฟล์

## Ownership และ concurrency ของผู้พัฒนา

claim task ใช้ commit ที่ไม่ force และตรวจ latest head ก่อน update หากมีคนเปลี่ยน branch ให้อ่านใหม่/reconcile ก่อน ห้ามตีความว่าเวลาผ่านไปนานจึงยึดงานที่อีก runner ยังทำได้

การรับช่วงต้องบันทึกเหตุผล ตรวจ owner/working changes และปลด ownership ตาม workflow จริง Parallel implementation ใช้ workspace แยกและ file ownership ชัดเจน หากไม่มี orchestration capability ให้ทำ inline

## Proposed local workflow

หลังสร้าง code scaffold แล้ว README ต้องมีคำสั่ง setup/test/run ที่ตรง toolchain จริง ระหว่างนี้ไม่รันคำสั่ง npm/test ที่ยังไม่มี manifest แล้วอ้างว่าเป็น verification

แนะนำ checkout ใหม่แยกจาก live installations, test data root แบบ disposable และ fake provider สำหรับ routine checks ก่อนใช้ provider จริง บันทึก OS/runtime/package versions ใน report

## ความต่อเนื่องระยะยาว

session ใหม่ต้องอ่าน checkpoint แล้วรู้ขั้นถัดไปได้ แต่การให้เกิด session ใหม่เองต้องอาศัย runner/scheduler ที่มีอยู่จริงและถูกเปิดใช้ แยกสถานะ WAITING_FOR_USER_START, RUNNING, WAITING, BLOCKED, COMPLETE ให้ชัด

หาก host หยุดหรือ context ใกล้หมด ให้ commit checkpoint ก่อนพักเมื่อทำได้ พร้อม exact next action ที่ทำซ้ำได้ ไม่รายงานว่าจะเดินต่อเบื้องหลังถ้าไม่มี runner ทำงานอยู่

## ตัวอย่างคำสั่งเริ่มในอนาคต

> เริ่มพัฒนา Zooid ขั้น Basic Provider Chat ตาม docs/development/README.md และ tasks/prepare-basic-chat.md ตรวจสถานะและ claim งานก่อน ทำต่อเนื่องภายในขั้นนี้จนผ่านเกณฑ์ อัปเดต checkpoint และรายงานความคืบหน้าสั้น ๆ โดยถามเฉพาะสิ่งที่จำเป็นจริง

ข้อความนี้เป็นตัวอย่างให้ผู้ใช้สั่งภายหลัง ไม่ใช่คำสั่งเริ่มอัตโนมัติจากเอกสาร
