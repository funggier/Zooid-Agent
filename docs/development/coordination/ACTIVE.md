# Active Work

- State: RUNNING
- Active development task: [ZOOID-0005 — Provider Configuration and Discovery](../tasks/ZOOID-0005-provider-configuration-discovery.md)
- Task ID: ZOOID-0005
- Branch: `agent/zooid-0005-provider-configuration-discovery`
- Base/main SHA: `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`
- Base post-merge workflow: `35375409259` SUCCESS — Ubuntu + Windows
- Previous completed task: ZOOID-0004 — Provider Routing Foundation
- Current phase: Provider Routing follow-on
- Current slice: Provider Configuration Service
- Next action: Work Package B RED tests → minimal configuration service → Ubuntu/Windows GREEN
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


## Work Package A verified

- RED SHA: `b583b83c81f005a2446f8bd5bb2095c852ac3b2e`
- RED workflow: `35375708930` — expected missing implementation
- GREEN SHA: `1a35200f24b5b08c9b1da07f399b2c68c7da35f3`
- GREEN workflow: `35375804129` — SUCCESS Ubuntu + Windows
- tests: 48/48
