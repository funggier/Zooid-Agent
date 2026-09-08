# Skills, Tools and Extensions

## แยกหน้าที่ให้ชัด

| ส่วน | หน้าที่ | สิ่งที่ไม่เกิดขึ้นอัตโนมัติ |
| --- | --- | --- |
| Skill | คำแนะนำ/ขั้นตอน/ตัวอย่างสำหรับโมเดล | ไม่ได้สิทธิ์เข้าถึงเครื่องจากข้อความ |
| Tool | interface ที่รับ input และส่ง result/evidence | ไม่ได้รับสิทธิ์ทุกอย่างของผู้ใช้โดยปริยาย |
| Adapter | แปลง protocol หรือเชื่อม runtime ภายนอก | ไม่ตัดสินว่างานสำเร็จเอง |
| Plugin package | บรรจุ skill/tools/config/dependencies | ไม่ได้รัน install script เพียงเพราะพบไฟล์ |
| Capability runtime | ตรวจสิทธิ์และเรียก executable/API | ไม่เชื่อ declaration ของ plugin แทน policy |
| MCP integration | ช่องทางค้นพบ/เรียกเครื่องมือภายนอก | ไม่รับรอง safety หรือ compatibility ทุก server |

การเข้าถึง PowerShell/terminal เกิดจาก tool implementation ที่เรียก process ภายใต้ OS permissions เช่น process runner ของภาษา runtime; skill อาจแนะนำวิธีใช้ tool แต่ไม่ได้เป็นตัวเปิด shell เอง

## Contract ของ tool ที่เสนอ

ToolDefinition มี name, input_schema, output_schema, required_permissions, timeout_policy, cancellation_support, side_effect_class, idempotency_support และ version

ToolResult มี status, structured_output, artifact_refs, operation_id, effect_receipt, stdout/stderr refs และ uncertainty ถ้า process ตายหลังแก้ไฟล์แล้ว ต้องสะท้อน partial/unknown ไม่คืน success แบบรวม ๆ

แยก read-only, local-write และ external-write เพื่อกำหนด policy ตามผลจริง การประกาศ read-only ต้องตรวจ implementation/test ไม่เชื่อ metadata อย่างเดียว

## Extension lifecycle

ค้นพบ package → ตรวจ manifest/provenance/dependencies → ผู้ใช้เปิดใช้ scope → register capability → dispatch ผ่าน policy → เก็บ evidence → disable/drain → uninstall resources ตาม inventory

เสนอ manifest ที่มี package identity, entry points, declared tools, dependencies, supported core contract, owned resources และ cleanup hook การลบ plugin ต้องไม่ลบ artifact ของผู้ใช้ที่เคยสร้างผ่าน tool

## การนำของ Hermes หรือ community มาใช้

ใช้แนวคิดและ skill ที่เหมาะสมได้ในทางสถาปัตยกรรม แต่ต้องตรวจเป็นรายชิ้น: เงื่อนไขการนำมาใช้และ notices, tool names, paths, provider assumptions, credentials, dependencies และ lifecycle

การเปิดอ่าน SKILL.md ได้ไม่ได้แปลว่าคำสั่งในนั้นทำงานกับ Zooid ได้ ให้ adapter mapping หรือ rewrite คำแนะนำให้ตรง runtime และเก็บที่มา สิ่งที่ยังไม่ตรวจต้องไม่อยู่ในรายการ supported

ในโครงการนี้ยังไม่ได้เลือก license ของ Zooid หรือนำโค้ดจากภายนอกเข้ามา ขั้นพัฒนาที่จะนำ dependency/โค้ดมาใช้ต้องบันทึก license/provenance ก่อนแจกจ่ายส่วนดังกล่าว

## ลำดับพัฒนา

ขั้น 1–4 ไม่มี tool ecosystem เพิ่มมาบังคับแชต ขั้น 5 ทำ pilot ขนาดเล็ก: artifact reader และ bounded test/process runner สำหรับตรวจงานใน workspace ทดสอบของ Zooid

หลัง pilot ผ่าน ให้รองรับ external tool adapter อย่างน้อยหนึ่งตัวพร้อม lifecycle test ก่อนเปิด SDK/community distribution เต็มรูปแบบ Bot platform connectors เป็นงานหลัง Group core ใช้งานได้

## Acceptance

- tool ที่ขอสิทธิ์นอก scope ถูกปฏิเสธโดย runtime แม้ skill บอกให้เรียก
- cancel/timeout ไม่ทิ้ง owned child process
- result ที่ schema ไม่ตรงไม่ทำให้ ticket ผ่าน validation
- retry external-write ที่ไม่รู้ผลไม่ dispatch ซ้ำโดยพลการ
- disable/uninstall extension แล้วไม่มี registration/process/task ของมันทำงาน
- package ที่ไม่เข้ากับ core contract แสดงเหตุผลก่อนเปิดใช้
