# Active Work

- State: RUNNING
- Active development task: [ZOOID-0005 — Provider Configuration and Discovery](../tasks/ZOOID-0005-provider-configuration-discovery.md)
- Task ID: ZOOID-0005
- Branch: `agent/zooid-0005-provider-configuration-discovery`
- Base/main SHA: `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`
- Base post-merge workflow: `35375409259` SUCCESS — Ubuntu + Windows
- Previous completed task: ZOOID-0004 — Provider Routing Foundation
- Current phase: Provider Routing follow-on
- Current slice: Durable provider catalog schema/store
- Next action: Work Package A RED tests → minimal implementation → Ubuntu/Windows GREEN
- Catalog principle: Adapter ≠ Provider Instance ≠ Model
- Discovery policy: read-only; never auto-enable
- Desired policy: enabled/disabled; removed means absent from active catalog
- Observed availability: available/unavailable/unknown
- Secrets in catalog: FORBIDDEN
- Automatic fallback: DEFERRED
- Single-model requirement: MUST remain valid with only `qwen3.8:27b`
- Helper model requirement: NONE
- Background execution: NOT_CONFIGURED

## Session recovery rule

Read `AGENTS.md`, this file, `STATUS.md`, ZOOID-0005 and the Provider Routing phase plan.

Do not reopen ZOOID-0004 implementation. It is merged and post-merge verified. ZOOID-0005 owns Provider Configuration/Discovery.
