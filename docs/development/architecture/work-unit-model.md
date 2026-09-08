# Work Unit Model

## แนวคิดที่ยึด

Session, Project, Group เป็นชื่อของรูปแบบใช้งานบนหน่วยที่มีตัวตนต่อเนื่อง ไม่ใช่ class hierarchy ที่ต้องไต่ขึ้นทีละชั้น Work Unit เพิ่มบทบาท workflow หรือความสัมพันธ์ได้ตามงานจริง

Session ไม่ใช่ provider: session เป็นพื้นที่สนทนาและขอบเขต context; provider/model เป็นทรัพยากรที่ผูกตอน run ส่วน run/attempt มีอายุสั้นและเปลี่ยนได้โดยไม่เปลี่ยนตัวตนงาน

## แบบข้อมูลขั้นต่ำที่เสนอ

| Entity | ฟิลด์สำคัญ | ความหมาย |
| --- | --- | --- |
| WorkUnit | id, title, objective_ref, revision, lifecycle_state | identity ที่ไม่เปลี่ยนเมื่อปรับรูปแบบ |
| UnitProfile | unit_id, capabilities, display_role | รูปแบบที่ UI เรียก Session/Project/Group |
| Session | id, unit_id, transcript_ref, context_policy | ประวัติและ policy ของการคุย |
| RoleBinding | unit_id, role, provider_policy, tool_scope | worker/reviewer/controller |
| Run | id, ticket_id, role_binding, input_manifest_ref | การเรียกงานเฉพาะครั้ง |
| OwnershipEdge | parent_id, child_id, revision | เจ้าของการกำหนดตารางและงบ |
| CollaborationLink | source_id, target_id, share_policy | เชื่อมข้อมูล/ส่งต่องานตามขอบเขต |
| ArtifactRef | artifact_id, source_unit_id, revision | อ้างผลโดยคงที่มา |

แบบข้อมูลเหล่านี้เกิดตาม phase; ขั้น 1 ใช้ session ID ที่จะรักษาไว้เมื่อ migrate ไม่ต้องสร้าง ownership graph ก่อนมีงานประกอบ

## กติกาโครงสร้าง

1. Ownership เป็น forest: หน่วยมี execution owner ได้สูงสุดหนึ่งราย และไม่มีวงจร
2. Collaboration เป็น graph แยกต่างหาก: เชื่อมข้ามได้แต่ไม่ได้สิทธิ์ schedule หรืออ่านทุกอย่าง
3. หน่วยที่อยู่ในหลายกลุ่มผ่าน link ใช้ผลร่วมกันได้ แต่การออก ticket ต้องส่งถึง owner เดิม
4. การรวมงานโดยปริยายคือสร้างหน่วยประสานและอ้างหน่วยเดิม ไม่รวม transcript หรือทำให้ ID เดิมหาย
5. การลดระดับทำได้เมื่อ active child/lease ถูกจัดการแล้ว; ไม่ทิ้ง ticket ที่ยังทำงาน
6. display role ไม่ใช้เป็นหลักฐานสิทธิ์ การเปลี่ยนชื่อเป็น Group ไม่ทำให้สิทธิ์เพิ่ม
7. revision guard และ transaction ใช้ตรวจ concurrent reshape; ผู้แพ้ต้องอ่าน state ใหม่

## Operations ที่ต้องออกแบบ

| Operation | Preconditions | ผลที่ต้องรักษา |
| --- | --- | --- |
| add-child | owner มีสิทธิ์, ไม่มี cycle | child ID ใหม่, ที่มาจาก parent |
| attach-owned | child idle/paused, owner เดิมยอมรับ | ย้าย owner แบบ atomic; ticket/history อยู่ครบ |
| link | ทั้งสองฝ่ายยอมรับ share scope | แชร์ selected refs; ไม่มี implicit ownership |
| unlink | ตรวจ outstanding handoff | หยุด share ครั้งใหม่; ประวัติการแชร์ยังตรวจได้ |
| promote | capability prerequisites ผ่าน | ID เดิม; เพิ่ม role/workflow configuration |
| demote | children/active work มีแผนรองรับ | ลด capability; ไม่ลบ evidence |
| split | ระบุ ticket/artifact ที่ย้าย | source mapping + explicit open-work owner |
| compose | ระบุ member refs + policy | กลุ่มใหม่โดยหน่วยเดิมยังเปิดเองได้ |
| archive | ไม่มี active lease หรือ cancel จบแล้ว | read-only history; retention ตาม policy |

## ตัวอย่างจากการใช้งาน

คุยเรื่องสวนใน Session A แล้วเริ่มทำแผนปลูก: เพิ่ม objective และ worker/review ใต้ A โดย URL/ID บทสนทนาเดิมยังใช้ได้ ต่อมามี Session B เรื่องงบประมาณ สามารถสร้าง Group C เชื่อม A กับ B โดยแชร์แผน/ยอดงบที่เลือก ไม่จำเป็นต้องแปลง B เป็น Project ก่อน

เมื่อจบโครงการ ถอด link และลด A เป็นพื้นที่สนทนาได้ แต่ใบตรวจรับ รายการงาน และที่มาของข้อสรุปยังเปิดดูได้

## ขอบเขตการพิสูจน์

ขั้น 5 ทดสอบ solo unit → Project → ลดรูปแบบในเครื่องเดียว ขั้น 6 เพิ่ม compose/link/detach หลายหน่วยและ budget routing การกระจายหน่วยข้ามเครื่องต้องมี protocol เพิ่ม จึงอยู่นอก baseline
