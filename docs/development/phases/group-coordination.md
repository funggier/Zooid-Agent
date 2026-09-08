# Group Coordination Implementation Plan

> **For agentic workers:** ใช้ executing-plans/handoff; เริ่มหลัง Project qualification ผ่าน

**Goal:** เชื่อมหน่วยงานที่มีอยู่เป็นงานร่วม และแยกกลับได้โดยคง identity/ขอบเขตข้อมูล  
**Architecture:** collaboration graph + ownership forest + scoped handoffs + shared resource policy  
**Tech Stack:** Work Unit/Project core เดิม; single-machine coordination ก่อน  
**Spec:** [Work Unit](../architecture/work-unit-model.md), [scope](../requirements-and-scope.md)

## เหตุผลและความสำคัญ

Group ขยายจากหน่วยงานเดี่ยวไปสู่องค์กรที่มีหลายเป้าหมายย่อย อุปมาบริษัทช่วยให้เข้าใจบทบาท แต่การแชร์งานต้องเป็น contract ไม่ใช่เปิด transcript ของทุกคนให้ทุกคนโดยอัตโนมัติ

Session สองอันสามารถ compose เป็น Group ได้โดยตรง ไม่ต้องสร้าง Project ว่างคั่น และแต่ละหน่วยยังเปิดใช้งานเดี่ยวได้

## Global constraints

ไม่เปลี่ยน ID เมื่อ attach/detach; ไม่เพิ่มสิทธิ์จากชื่อระดับ; ownership มีผู้ schedule รายเดียว; link ไม่เท่ากับ transfer; cross-machine federation/bot connectors ยังเป็นขอบเขตถัดไป

## Contracts

GroupMembership: group_id, member_id, relationship(owned/linked), share_policy, budget_policy, revision  
Handoff: id, source_unit, target_unit, requested_outcome, artifact_refs, acceptance_ref, permission_scope, delivery_state  
HandoffReceipt: handoff_id, accepted_ticket_id, accepted_scope, revision

ใช้ handoff ID เป็น dedupe identity; target ที่รับแล้วคืน ticket เดิมเมื่อ message ถูก replay

## Work packages

### Membership and composition

**Files:** src/groups/membership-service.ts, src/work/structure-transactions.ts; tests/groups/membership.test.ts

- [ ] compose จาก existing sessions/projects โดย references
- [ ] attach-owned กับ link มี API แยกและ preconditions ต่างกัน
- [ ] cycle/dual ownership/revision conflict ถูกปฏิเสธ
- [ ] detach ตรวจ outstanding work แล้ว drain/reassign ตาม explicit policy
- [ ] demote/split คง source mapping และ artifact access ที่มีประวัติ
- [ ] commit restructure traces ทั้ง success และ interrupted transaction

### Scoped exchange and coordination

**Files:** src/groups/coordinator.ts, src/groups/handoff-service.ts; tests/groups/handoff.test.ts, tests/groups/privacy.test.ts

- [ ] ส่ง brief/selected evidence ตาม share scope; ไม่ส่ง transcript ทั้งหมด
- [ ] permission filter ก่อน retrieval และก่อน dispatch
- [ ] durable handoff + target receipt ป้องกัน duplicate ticket
- [ ] scheduler เคารพ execution owner และ dependencies ข้ามหน่วย
- [ ] group summary อ้าง revision ของ member result; stale result ต้องตรวจใหม่
- [ ] commit inter-unit failure/replay cases

### Resources, lifecycle and qualification

**Files:** src/groups/resource-policy.ts; tests/groups/budgets.test.ts, tests/groups/lifecycle.test.ts

- [ ] budget/quota รวมกลุ่มมี reservation และ fairness ไม่ให้หน่วยเดียวครองทรัพยากร
- [ ] detect dependency deadlock พร้อมเส้นทางที่ติดและทางแก้
- [ ] cancel group propagate เฉพาะ owned work ตาม policy; linked work ไม่ถูกยึดโดยปริยาย
- [ ] reset/uninstall drain handoff และไม่ปลุก member จาก old runner
- [ ] ทดสอบ compose → work → review → detach → standalone
- [ ] commit Group demo และข้อจำกัดที่ยังไม่รองรับ

## Acceptance scenarios

- Session A และ B เข้า Group C โดยไม่เปลี่ยน ID/history; ทั้งสองยังเปิดเดี่ยวได้
- A แชร์ artifact เดียว: B เห็นเฉพาะสิ่งนั้นและ brief ที่อนุญาต
- handoff ส่งซ้ำหลัง restart: target มี ticket เดียว
- member เชื่อมสองกลุ่ม: ไม่มีสอง execution owners
- detach ระหว่าง active work: blocked/drain/reassign อย่างชัดเจน ไม่ orphan ticket
- stale group aggregate ไม่ผ่าน completion ถ้า member result revision เปลี่ยน
- cancel C ไม่ยกเลิกงานอิสระของ linked member โดยไม่มี scope
- ไม่มี task/service/process เก่าของ Group ตื่นหลัง reset

**Exit gate:** membership/exchange/budget/lifecycle tests ผ่าน และ demo รวมงานเดิมจากหลาย session แล้วแยกกลับได้ การเชื่อมแชตบอทภายนอกอาจสร้างบน Group ภายหลัง แต่ไม่อ้างว่าจะเหนือกว่าระบบอื่นโดยยังไม่ได้วัด
