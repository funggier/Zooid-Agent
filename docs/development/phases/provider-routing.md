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

## Provider management model

Provider management must preserve three separate identities:

```text
Adapter / protocol implementation
        ↓
Provider instance / endpoint or account
        ↓
Models exposed by that provider
```

Examples:

- adding another Ollama/OpenAI-compatible endpoint uses the existing adapter and should be configuration-only;
- adding or disabling a model under an existing provider should be configuration-only;
- supporting a genuinely new wire protocol requires a new adapter implementation;
- a provider ID must not be forced to equal the adapter name because many provider instances may share one adapter.

### Configuration ownership

Provider and model inventory must become durable Zooid configuration rather than source-code constants.

Target management path:

```text
CLI / future UI / future API
            ↓
Provider Configuration Service
            ↓
Provider Registry
            ↓
Provider Router
```

The UI must not implement a second provider-management logic path; all interfaces use the same configuration service/contract.

### Provider/model lifecycle semantics

Prefer reversible state changes over destructive deletion:

- `enabled`: configured and permitted for new Zooid routes;
- `disabled`: intentionally retained but not permitted for new routes;
- `unavailable`: configured/enabled policy exists but the provider currently does not report/reach the resource;
- `removed`: absent from active configuration, while historical attribution remains valid.

Removing or disabling a provider/model affects future routing only. It must never erase or rewrite old `providerId`, `model`, `routeId`, or `adapterRevision` attribution stored with completed work.

### Discovery versus permission

Provider-specific discovery may report resources that physically exist, but discovery does not grant Zooid permission to use them.

```text
Discovered/available models
          ∩
Zooid-enabled models
          =
Routable models
```

For Ollama, a future discovery implementation may inspect the local model inventory (for example through its native model-list endpoint). Newly discovered models must not be auto-enabled merely because another application installed them.

### Credentials

Credentials belong to a provider instance/account/endpoint, not to individual model definitions. Durable provider configuration should reference a credential identifier; secret material must remain outside ordinary persisted configuration and logs.

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

### Provider configuration and discovery follow-on

After route snapshot + same-session switching is integrated:

- [ ] define durable provider-instance configuration independent from adapter implementation;
- [ ] add/disable/remove provider instance without source-code changes when its adapter already exists;
- [ ] add/disable/remove model without source-code changes;
- [ ] expose enabled/disabled/unavailable state explicitly;
- [ ] preserve historical attribution after provider/model removal;
- [ ] keep credentials provider-scoped and secret values outside ordinary config;
- [ ] provider-specific discovery is read-only by default;
- [ ] discovered models are not automatically enabled;
- [ ] compute routable models from availability + explicit Zooid enablement;
- [ ] CLI management commands use the same configuration service intended for later UI/API use;
- [ ] tests prove config reload cannot silently change an already snapshotted in-flight route.

**Deferred:** cost/latency-based auto routing, silent fallback, load balancing; จะเพิ่มหลัง ticket/attempt ทำให้บันทึก retry และค่าใช้จ่ายได้ถูกต้อง
