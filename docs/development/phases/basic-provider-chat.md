# Basic Provider Chat Implementation Plan

**Goal:** เปิด Zooid แล้วสนทนา text กับ provider เดียวได้  
**Architecture:** CLI → chat service → adapter; Zooid เก็บประวัติเอง ไม่มี ticket engine หรือ background agent loop  
**Tech Stack:** Node.js 24 + TypeScript strip-only — VERIFIED สำหรับ foundation/transport ผ่าน Ubuntu + Windows CI  
**Spec:** [system overview](../architecture/system-overview.md), [scope](../requirements-and-scope.md)

## เหตุผลและความสำคัญ

ต้องพิสูจน์เส้นทาง input → request → response ที่เรียบง่ายก่อน เพื่อแยกปัญหา provider/credentials/history ออกจากความซับซ้อนของ workflow หากแชตพื้นฐานยังไม่ชัด การเพิ่ม agent loop จะทำให้หาต้นเหตุยาก

## Global constraints

- text only, provider เดียว, manual interaction, no background scheduler
- session identity เป็นของ Zooid; configuration/secret ไม่ปะปน transcript
- paths และ cleanup inventory ตั้งแต่เริ่ม
- deterministic tests ใช้ fake provider/local HTTP fixture
- external live smoke ต้องใช้ endpoint/credentials ที่ได้รับอนุญาตและห้ามบันทึก secret

## Components และ contracts

Message: id, session_id, sequence, role(user/assistant), text, status(pending/complete/interrupted/failed), created_at  
ChatRequest: session_id, messages, model, request_id, cancel_signal  
ChatResult: response_id, text, finish_reason, usage_optional  
ProviderError: kind(auth/rate_limit/timeout/network/unsupported/invalid_response), retry_after_optional, safe_message

เริ่ม non-streaming response แล้ว Streaming/tools ยังไม่เป็นข้อบังคับของ kernel และไม่อยู่ใน Basic Chat gate ปัจจุบัน

## Work packages

### Chat foundation — VERIFIED by ZOOID-0001

- [x] Node.js 24 + TypeScript strip-only baseline และ README commands
- [x] CLI รับข้อความ, new/open session, exit และ cancel
- [x] stable ID กับ transcript sequence
- [x] temp-write/atomic replace และ corrupt-file preservation
- [x] Thai/multiline input
- [x] blank input ไม่เปลี่ยน transcript
- [x] reopen session
- [x] data root path มีช่องว่าง
- [x] isolated disposable test roots
- [x] Ubuntu + Windows CI

Evidence: [ZOOID-0001 report](../reports/ZOOID-0001-basic-chat-foundation-report.md)

### First real HTTP transport — VERIFIED by ZOOID-0002 fixtures

- [x] typed provider configuration; fake default
- [x] OpenAI-compatible Chat Completions request mapping
- [x] optional Bearer authorization โดยไม่ log secret
- [x] prior complete history + current pending user; exclude failed/interrupted attempts
- [x] success response mapping และ provider response ID
- [x] 401/403 auth normalization
- [x] 429 rate-limit + Retry-After
- [x] 5xx/network normalization
- [x] malformed JSON/schema handling
- [x] timeout แยกจาก user cancellation
- [x] late assistant response guard ผ่าน ChatService contract
- [x] CLI → local HTTP fixture → stdout smoke
- [x] Ubuntu + Windows CI
- [ ] external live compatible endpoint multi-turn smoke

Evidence: [ZOOID-0002 report](../reports/ZOOID-0002-openai-compatible-provider-report.md)

## Acceptance scenarios

| Given / When | Then | State |
| --- | --- | --- |
| ส่งข้อความไทย/หลายบรรทัด | persisted/ordered correctly | PASS |
| restart แล้ว open session ID | committed history remains | PASS |
| blank input | no transcript mutation | PASS |
| invalid/missing provider config | fail before dispatch; no secret output | PASS |
| compatible HTTP success | response normalized and persisted | PASS via local fixture |
| 401/403/429/5xx/malformed | normalized ProviderError | PASS via local fixture |
| timeout | ProviderError(timeout) | PASS via local fixture |
| cancel pending request | interrupted; no late assistant | PASS |
| corrupt transcript | preserve original file | PASS |
| test root path with spaces | create/reopen works | PASS |
| real compatible model multi-turn | successful live response with history | NOT_RUN |

## Exit gate

**Basic Provider Chat phase remains OPEN.**

Foundation and HTTP protocol/transport are verified, but the phase must not be marked complete until an authorized external/live compatible model endpoint succeeds in a multi-turn chat and the result is recorded without secrets.

Router work remains gated behind that live qualification.
