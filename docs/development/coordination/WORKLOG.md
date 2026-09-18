# Worklog

## 2026-09-18 — ZOOID-0003 live qualification harness started

ZOOID-0002 merged through PR #2 to main commit `cffc12030d345e9b04a63e918bff50c96b608a7b`. Post-merge workflow `35359739796` passed Ubuntu and Windows.

Opened branch `agent/zooid-0003-live-provider-qualification`.

Implemented a reusable two-turn live qualification: turn 1 supplies a random marker, turn 2 must recover it through persisted session history. The harness also validates the four-message ordered complete transcript and emits machine-readable output without provider secrets.

Deterministic fixtures cover both PASS-with-history and semantic FAIL-without-marker cases. External live evidence remains a separate gate.

---

## 2026-09-18 — ZOOID-0002 protocol transport verified

ZOOID-0002 added the OpenAI-compatible Chat Completions transport and passed Ubuntu/Windows fixture CI. It intentionally did not claim a live external model result.

Detailed evidence: [ZOOID-0002 report](../reports/ZOOID-0002-openai-compatible-provider-report.md).

---

## 2026-09-18 — ZOOID-0001 basic chat foundation verified

ZOOID-0001 established the Node.js 24 / TypeScript foundation, file-backed sessions, fake provider, ChatService and CLI.
