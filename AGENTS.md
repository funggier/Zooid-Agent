# Zooid contributor instructions

This is the Zooid repository, not the previous Hermes-derived repository.

## Read before work

1. Read [active work](docs/development/coordination/ACTIVE.md) and [current status](docs/development/coordination/STATUS.md).
2. Read the active numbered task under [tasks](docs/development/tasks/README.md) and its evidence report.
3. Read the relevant phase, architecture contracts and acceptance criteria.
4. Follow [development handoff](docs/development/guides/development-handoff.md).

## Scope and authority

- Implementation has started. Follow the current numbered task/ACTIVE scope; do not infer permission to jump across the whole roadmap merely because plans exist.
- Progress through ready work within the authorized scope, update durable checkpoints, and avoid asking whether to continue after every small step.
- Current user instructions override earlier plans. Record scope changes; do not silently revive old fork assumptions.
- Basic Provider Chat is the current phase. Project/Group are staged targets, not prerequisites for early chat work.
- Use CogentNexus-OpenClaw as a development host/evidence source when available; Zooid must not silently depend on it at runtime.
- Claims about other repositories/capabilities require source/commit evidence.
- Never commit secrets or installed-state files. Keep test roots isolated from live installations.
- Do not alter unrelated live installations or external projects as a side effect of Zooid development.

## Durable task discipline

- Every implementation scope gets the next sequential ID: `ZOOID-0001`, `ZOOID-0002`, ...
- The number is a development task sequence, not a software release/version.
- Default to Task ↔ Branch pairing such as `ZOOID-0002` ↔ `agent/zooid-0002-...`.
- Preserve why the task exists, scope/non-scope, decisions, progress, failures, evidence, limitations and exact next action.
- Never erase failed attempts that materially explain the final design; summarize them in the task/report.
- Completed or superseded task files remain as history.

## Verification discipline

- Distinguish USER_DIRECTION, DESIGN_PROPOSAL, VERIFIED and NOT_IMPLEMENTED.
- Record the exact implementation SHA, test command/workflow, observed result and limitations before marking software complete.
- A document cannot reliably contain the SHA of the commit that contains itself. Record the last verified implementation SHA and read the live Git ref for current HEAD.
- Claim/move branches with conflict-aware Git updates; never force-push routine development.
- Keep changes reviewable and update STATUS/ACTIVE/report at meaningful checkpoints.
- Do not claim continuous unattended execution unless a durable runner has actually been installed, enabled and tested.
