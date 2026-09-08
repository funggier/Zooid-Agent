# Data and Context Architecture

## เหตุผลและความสำคัญ

context ของโมเดลมีขอบเขต แต่ประวัติของงานอาจโตต่อเนื่อง การเพิ่มหน้าต่าง context อย่างเดียวไม่แก้การแยกข้อเท็จจริง สถานะ และคำพูดเก่า Zooid จึงต้องเก็บความต่อเนื่องไว้นอก run และเลือกข้อมูลที่จำเป็นต่อการตัดสินใจครั้งนั้น

SQLite เป็นข้อเสนอเริ่มต้นสำหรับ local transactional state ไม่ได้เสนอฐานข้อมูลชนิดใหม่เพียงเพราะงานซับซ้อน ความสามารถสำคัญอยู่ที่ schema, provenance, retrieval และความถูกต้องของการเปลี่ยนสถานะ

## ชั้นข้อมูล

| ชั้น | สิ่งที่เก็บ | Authority / retention |
| --- | --- | --- |
| Intent and constraints | เป้าหมาย ข้อห้าม การยอมรับ การเปลี่ยนคำสั่ง | เปลี่ยนด้วยคำสั่ง/decision ที่ระบุที่มา |
| Current state | ticket, attempt, ownership, wait condition | transaction + revision guard |
| Event ledger | transition, actor, correlation, reason | append ตาม policy; ไม่ใส่ secret |
| Transcript | ข้อความดิบและ tool result refs | historical evidence ไม่ใช่ state ปัจจุบันเสมอ |
| Knowledge | facts, decisions, uncertainties, supersession | accepted record + source refs |
| Artifact store | source files, test output, large results | immutable revision/hash + referenced ownership |
| Snapshot | projection/checkpoint/summary | derived; มี source range และ schema version |
| Retrieval index | text/vector/search cache | rebuild ได้; ไม่เป็นแหล่งจริงเพียงแหล่งเดียว |

## Logical schema ตั้งแต่ขั้น 3 ถึง 5

- sessions(id, unit_id, created_at), messages(id, session_id, sequence, role, content_ref, status)
- tickets(id, unit_id, ingress_key, state, revision, acceptance_ref, cancel_requested_at)
- attempts(id, ticket_id, ordinal, route_ref, state, lease_epoch, request_ref, result_ref)
- events(id, aggregate_id, aggregate_sequence, event_type, payload_ref, created_at)
- results(id, ticket_id, attempt_id, content_ref, evidence_refs, acceptance_revision)
- deliveries(id, result_id, destination, dedupe_key, state, receipt_ref)
- operations(id, attempt_id, operation_key, effect_kind, state, receipt_ref)
- artifacts(id, content_hash, relative_location, owner_id, retention_class)
- knowledge(id, kind, source_refs, valid_from, supersedes_id, acceptance_state)
- context_manifests(id, ticket_id, role, model_capability_revision, budget, selected_refs)
- work_units, role_bindings, ownership_edges, collaboration_links ตาม [Work Unit](work-unit-model.md)

กำหนด unique constraint สำหรับ ingress_key ในขอบเขตช่องทาง/เจ้าของงาน, event sequence ต่อ aggregate, attempt ordinal ต่อ ticket และ operation_key ตาม logical effect ไม่สร้าง key ใหม่ทุก retry เมื่อเป็นผลเดียวกัน

## Context contract

ContextPackage ต้องระบุ task goal, pinned constraints, current state revision, role instructions, acceptance criteria, relevant evidence refs, remaining budget และ unresolved questions

งบ input = model window − reserved output − tool/schema overhead − safety margin ถ้า pinned constraints อย่างเดียวเกินงบให้หยุด dispatch พร้อมเหตุผล ไม่ตัดข้อกำหนดโดยเงียบ

จัดลำดับข้อมูล: คำสั่งและข้อกำหนดที่ยังมีผล → สถานะ/เกณฑ์งานนี้ → หลักฐานจำเป็น → ความรู้ที่เกี่ยวข้อง → บทสนทนาระยะใกล้ ข้อมูลนอกงบต้องมี reference ให้ค้นกลับได้

แต่ละ provider ต้องประเมิน tokens ด้วยวิธีที่เหมาะกับ protocol ถ้าประเมินไม่แม่นใช้ margin และ handle context rejection แบบสร้าง package ใหม่ที่บันทึกการเปลี่ยน ไม่ลบประวัติเพื่อให้ส่งผ่าน

## สรุปและเรียกกลับ

Summary เป็น derived view ต้องบันทึก source range/hash, generated_by, role, omissions และข้อขัดแย้ง ห้ามแทนที่คำสั่งล่าสุดด้วยข้อสรุปเก่า เมื่อข้อมูลสำคัญไม่ตรงกันให้ retrieve แหล่งเดิมแล้วบันทึก resolution

เริ่ม retrieval ด้วย ID/metadata และ lexical search ก่อน เพิ่ม vector search เมื่อชุดทดสอบพิสูจน์ว่าช่วย recall อย่างคุ้มค่า Vector similarity ไม่ยืนยันความจริงหรือสิทธิ์เข้าถึง ต้อง filter scope ก่อนส่งเนื้อหาเข้าโมเดล

## Persistence และ schema evolution

- commit ticket/state/event/outbox ที่เกี่ยวข้องใน transaction เดียว
- artifact เขียนไป temp → ปิด/ตรวจ hash → publish → commit reference; crash อาจเหลือ orphan ที่ GC ได้
- GC ลบเฉพาะ unreferenced artifact หลัง grace period และตรวจ in-flight write; event/delivery ที่ยังอ้างต้อง pin
- migration มีชื่ออธิบาย เช่น add-ticket-leases พร้อม ordered ID/checksum ภายใน migration metadata
- backup ต้องเป็น consistent snapshot ของ DB และ artifact manifest ไม่คัดลอก DB file ระหว่างเขียนแบบสุ่ม
- ทดสอบ restore และ compatibility; รุ่นโปรแกรมกับรุ่น schema เป็นคนละค่า
- ถ้า downgrade อ่าน schema ใหม่ไม่ได้ ต้องใช้ backup ที่เข้ากันและแจ้งขอบเขตข้อมูล ไม่สัญญา rollback ได้ทุก migration

## ความสะอาดและขนาดข้อมูล

เก็บ audit ที่จำเป็น ไม่เก็บ raw prompt/response ซ้ำทุกชั้น กำหนด retention ต่อข้อมูลและพื้นที่สูงสุด; dry-run แสดงก่อน prune

การลบ session ชั่วคราวหมายถึงลบ working context ตาม policy หลังผล/หลักฐานถูกยอมรับแล้ว ไม่ได้หมายถึงลบ artifact ที่ยังใช้อ้าง หรือรับประกัน secure erase ของสื่อ/backup ทุกชนิด

เกณฑ์เชิงปริมาณอยู่ใน [quality gates](../acceptance/quality-gates.md)
