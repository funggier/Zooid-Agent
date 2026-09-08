# Provider Routing Implementation Plan

> **For agentic workers:** ดำเนินทีละ task ตาม executing-plans/handoff หลังขั้น Chat ผ่าน

**Goal:** สลับ provider/model โดยคง session เดิม  
**Architecture:** neutral transcript → capability check → explicit route → adapter  
**Tech Stack:** stack ที่เลือกในขั้น 1; ไม่เพิ่ม service ใหม่  
**Spec:** [system overview](../architecture/system-overview.md), [data/context](../architecture/data-and-context.md)

## เหตุผลและความสำคัญ

ถ้าประวัติผูกกับ provider การเปลี่ยนโมเดลจะกลายเป็นการเริ่มงานใหม่ Router จึงต้องแยกตัวตนการสนทนาออกจากทรัพยากรประมวลผล และแสดงข้อจำกัดของปลายทางอย่างตรงไปตรงมา

## Global constraints

manual switching ก่อน automatic fallback; credentials แยก provider; adapter มีสิทธิ์อ่านเพียง history ที่ส่งให้; ไม่โอน private provider state โดยสมมติว่าแปลงได้

## Components/contracts

ProviderDescriptor: provider_id, models, supported_roles, content_types, streaming_support, context_limit, usage_support  
RouteRequest: session_id, selected_provider, model, required_capabilities  
RouteDecision: route_id, provider_id, model, adapter_revision, compatibility_result, reason  
RouteSelection เป็น setting ของ next request ไม่เปลี่ยน provider attribution ของข้อความเก่า

## Work packages

### Registry และ capability contract

**Files:** src/providers/registry.ts, src/providers/contracts.ts; tests/providers/capabilities.test.ts

- [ ] register adapters สองตัวที่มี capability ต่างกันผ่าน contract เดียว
- [ ] ตรวจ missing/duplicate provider ID และ unsupported model ก่อน network call
- [ ] ระบุ mapping ของ system/user/assistant roles และ payload ที่ไม่รองรับ
- [ ] fixture ยืนยันว่า adapter ไม่ทิ้ง message/content แบบเงียบ
- [ ] commit contract และ compatibility matrix

**Consumes:** adapter definitions  
**Produces:** validated ProviderDescriptor lookup

### Routing และ same-session switching

**Files:** src/providers/router.ts, src/cli/chat.ts, src/chat/session-store.ts; tests/providers/router.test.ts

- [ ] เพิ่มคำสั่งเลือก route และแสดง provider/model ปัจจุบัน
- [ ] snapshot route ต่อ request; การสลับระหว่าง in-flight มีผล request ถัดไป
- [ ] สร้าง input จาก neutral transcript เดิมแล้วตรวจ window/capability
- [ ] บันทึก RouteDecision และ source provider ของคำตอบ
- [ ] ทดสอบ A → B → A โดย session ID/sequence เดิม
- [ ] commit พร้อม report route traces ที่ไม่เผย credentials

**Consumes:** RouteRequest + transcript  
**Produces:** RouteDecision + provider request, หรือ compatibility rejection

## Acceptance

- คุยสอง turn บน A สลับ B แล้ว B ได้ history ที่รองรับครบใน ID เดิม
- สลับขณะ A กำลังตอบ: result ของ A มี attribution เดิม ไม่ถูกบันทึกว่า B ตอบ
- provider B window เล็กกว่า history: แจ้งก่อนส่ง; ขั้นนี้ยังไม่อ้างมีระบบ context ขั้น 5
- payload ที่ไม่รองรับ: ปฏิเสธหรือเสนอ conversion ที่แจ้งข้อมูลหายชัดเจน
- provider ล่ม: error ไม่เปลี่ยน route โดยผู้ใช้ไม่รู้ และไม่เพิ่ม assistant success
- reload settings ไม่ทำให้ credential ของ A ถูกส่งไป B

**Exit gate:** adapter conformance tests ทั้งสองชุดและ switching scenarios ผ่าน สามารถใช้คนละ protocol fixture; live provider ที่สองให้บันทึกสถานะตามจริง ไม่อ้างว่ารองรับทุก provider

**Deferred:** cost/latency-based auto routing, silent fallback, load balancing; จะเพิ่มหลัง ticket/attempt ทำให้บันทึก retry และค่าใช้จ่ายได้ถูกต้อง
