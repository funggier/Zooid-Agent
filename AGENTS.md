# Zooid contributor instructions

This is the new Zooid repository, not the previous Hermes-derived repository.

## Read before work

1. Read [development index](docs/development/README.md).
2. Read [current status](docs/development/coordination/STATUS.md) and [active work](docs/development/coordination/ACTIVE.md).
3. Read the relevant phase, architecture contracts, and acceptance criteria.
4. Follow [development handoff](docs/development/guides/development-handoff.md).

## Scope and authority

- Current authorization is development documentation. Do not infer permission to implement the entire roadmap from the existence of these plans.
- When the user explicitly starts implementation, progress through authorized ready tasks, update durable checkpoints, and avoid asking whether to continue after every task.
- Current user instructions override earlier plans. Record scope changes; do not silently revive the old independence audit.
- Future implementation starts at basic provider chat. Project/Group are staged targets, not prerequisites for the first chat.
- Use CogentNexus-OpenClaw as a development host and evidence source when available; do not assume Zooid requires that product at runtime.
- Claims about capabilities of other repositories require source/commit evidence. Baseline targets in these docs are not verified reports about those products.
- No application code, secrets, installed-state files, or inherited upstream tree belongs in a documentation-only change.
- Do not alter live installations or external projects as a side effect of developing Zooid.

## Documentation discipline

- English semantic folder/file names; no release-number filenames. Store versions, dates, and commit hashes inside documents.
- Preserve why a decision was made, alternatives, limits, acceptance evidence, and the next actionable step.
- Distinguish USER_DIRECTION, DESIGN_PROPOSAL, VERIFIED, and NOT_IMPLEMENTED.
- Record source SHA, test command, result, and limitations before marking software done.
- Claim tasks with a conflict-aware Git update. Do not force push, overwrite another worker's claim, or treat an expired heartbeat alone as ownership transfer.
- Keep changes reviewable. Update status and a task report at each meaningful checkpoint.
- Do not claim continuous unattended execution unless a durable runner has actually been installed, enabled, and tested.
