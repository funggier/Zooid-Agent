# Basic Provider Chat Implementation Plan

> **For agentic workers:** ใช้ executing-plans หากมี หรือทำ task-by-task ตาม handoff; เริ่มเมื่อผู้ใช้สั่ง implementation และบันทึกหลักฐานทุก gate

**Goal:** เปิด Zooid แล้วสนทนา text กับ provider เดียวได้  
**Architecture:** CLI → chat service → adapter; Zooid เก็บประวัติเอง ไม่มี ticket engine หรือ background agent loop  
**Tech Stack:** TypeScript/Node.js เป็นข้อเสนอ; ยืนยันผ่าน [งานเตรียม](../tasks/prepare-basic-chat.md)  
**Spec:** [system overview](../architecture/system-overview.md), [scope](../requirements-and-scope.md)

## เหตุผลและความสำคัญ

ต้องพิสูจน์เส้นทาง input → request → response ที่เรียบง่ายก่อน เพื่อแยกปัญหา provider/credentials/history ออกจากความซับซ้อนของ workflow หากแชตพื้นฐานยังไม่ชัด การเพิ่ม agent loop จะทำให้หาต้นเหตุยาก

## Global constraints

- text only, provider เดียว, manual interaction, no background scheduler
- session identity เป็นของ Zooid; configuration/secret ไม่ปะปน transcript
- paths และ cleanup inventory ตั้งแต่เริ่ม; ไม่ต้องมี installer สมบูรณ์เพื่อทดสอบจาก checkout
- tests ใช้ fake provider; live smoke ต้องมี credentials ที่ผู้ใช้อนุญาตและ quota เหมาะสม

## Components และ contracts

Message: id, session_id, sequence, role(user/assistant), text, status(pending/complete/interrupted/failed), created_at  
ChatRequest: session_id, messages, model, request_id, cancel_signal  
ChatResult: response_id, text, finish_reason, usage_optional  
ProviderError: kind(auth/rate_limit/timeout/network/unsupported/invalid_response), retry_after_optional, safe_message

เริ่ม non-streaming response ได้ แล้วเพิ่ม streaming เป็น task ย่อยเมื่อ cancel/partial transcript มี behavior ชัดเจน ไม่ให้ UI stream เป็นข้อบังคับของ kernel

## Work packages

### Chat foundation

**Files:** src/cli/chat.ts, src/config/settings.ts, src/chat/messages.ts, src/chat/session-store.ts; tests/chat/session.test.ts

- [ ] เลือก stack และ pin runtime จากงานเตรียม พร้อมคำสั่งรันจริงใน README
- [ ] สร้าง CLI รับข้อความ, new/open session, exit และ cancel
- [ ] สร้าง stable ID กับ transcript ที่เรียง sequence ชัดเจน
- [ ] เก็บ history ด้วย temp-write/atomic replace และตรวจไฟล์เสีย; อย่าเขียนทับฉบับเสียทันที
- [ ] ทดสอบข้อความไทย/หลายบรรทัด/empty input, เปิด session เดิม และ path มีช่องว่าง
- [ ] ตรวจ clean state ใน isolated root แล้ว commit พร้อม report

**Consumes:** user text, settings, session ID  
**Produces:** ordered ChatRequest และ persisted user message; cancel ที่ส่งต่อ adapter ได้

### First adapter

**Files:** src/providers/contracts.ts, src/providers/adapters/text-provider.ts; tests/providers/text-provider.test.ts

- [ ] เขียน fake transport fixture สำหรับ success/auth/timeout/cancel/malformed response
- [ ] implement request mapping และ normalize errors โดยเก็บ provider response ID เป็น reference
- [ ] ส่ง complete result กลับ chat service แล้วบันทึก assistant message หนึ่งครั้ง
- [ ] ทดสอบ cancel ระหว่างรอ: late response ต้องไม่ถูกแสดงเป็นคำตอบใหม่ที่ผู้ใช้ไม่รู้ที่มา
- [ ] ทำ live smoke เมื่อพร้อม และ redact logs ก่อนแนบหลักฐาน
- [ ] commit adapter และระบุ protocol/model/version ที่ทดสอบจริง

**Consumes:** ChatRequest  
**Produces:** ChatResult หรือ ProviderError; ไม่แก้ ticket/workflow state

## Acceptance scenarios

| Given / When | Then |
| --- | --- |
| session ใหม่ ส่ง “สวัสดี” แล้ว “เมื่อกี้ผมพูดอะไร” | request ที่สองมีข้อความก่อนหน้าเรียงถูก; ผลแสดงใน session เดิม |
| restart แล้ว open session ID | ประวัติที่ commit แล้วอยู่ครบ |
| missing credential | ไม่ dispatch; แจ้ง config key ที่ขาดโดยไม่พิมพ์ secret |
| fake transport timeout | UI กลับควบคุมได้; user message อยู่; ไม่สร้าง assistant success |
| cancel pending request | request ยุติหรือถูก mark interrupted; ไม่มี response ซ้ำ |
| transcript file corrupt | แจ้ง restore/recovery path; ไม่ทำลายไฟล์ต้นฉบับ |
| reset all ใน test root แล้วเปิดใหม่ | ได้ first-run state; ไม่มี history/config เก่ากลับมา |

**Exit gate:** scenario ทั้งหมดผ่าน มี demo แชตจริงเมื่อ provider พร้อม และ report ระบุสิ่งที่ทดสอบด้วย fixture เทียบกับ live ไม่มี requirement ว่าต้องมี tools/router/project ก่อนปิดขั้นนี้
