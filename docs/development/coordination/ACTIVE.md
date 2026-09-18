# Active Work

- State: RUNNING
- Active development task: [ZOOID-0005 — Provider Configuration and Discovery](../tasks/ZOOID-0005-provider-configuration-discovery.md)
- Task ID: ZOOID-0005
- Branch: `agent/zooid-0005-provider-configuration-discovery`
- Base/main SHA: `5a6a472a01d4257241e6a6b46e62a7b7ed2051ea`
- Base post-merge workflow: `35375409259` SUCCESS — Ubuntu + Windows
- Previous completed task: ZOOID-0004 — Provider Routing Foundation
- Current phase: Provider Routing follow-on
- Current slice: Discovery interface and Ollama inventory
- Next action: Work Package D RED tests → read-only discovery/availability overlay → Ubuntu/Windows GREEN
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


## Work Package B verified

- RED SHA: `ac6a4ee6039558588c7db6951dd32da468143938`
- RED workflow: `35376019986`
- GREEN SHA: `4b8e5f234baa82c27d9c3e608612a7c24422ee86`
- GREEN workflow: `35376109866` — SUCCESS Ubuntu + Windows
- tests: 56/56


## Work Package C verified

- RED SHA: `5e7d3bfb97a5899c4ea1e8d4eedf122b08e87ae7`
- RED workflow: `35376392829`
- GREEN SHA: `981d1284bb28b4a99d5145f75af70a0601a30ac2`
- GREEN workflow: `35376510252` — SUCCESS Ubuntu + Windows
- tests: 62/62
