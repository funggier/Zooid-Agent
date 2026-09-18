# Worklog

## 2026-09-18 — ZOOID-0002 provider adapter started

ZOOID-0001 merged through PR #1 to main commit `a477fe7abedee21e03f171e249c5c8bdac7cdecb`. Post-merge workflow `35358295752` passed Ubuntu and Windows.

Opened branch `agent/zooid-0002-openai-compatible-provider` and task [ZOOID-0002](../tasks/ZOOID-0002-openai-compatible-provider.md).

The first external transport is scoped as an OpenAI-compatible Chat Completions **protocol adapter**, not an OpenAI-vendor adapter. This permits deterministic local HTTP fixtures and compatible local endpoints while leaving OpenAI Responses API and future provider routing as separate boundaries.

Next checkpoint: typed provider configuration + native HTTP request/response/error/cancel tests.

---

## 2026-09-18 — ZOOID-0001 basic chat foundation verified

Implemented a zero-runtime-dependency Node.js 24 / TypeScript foundation with ordered file-backed sessions, provider contract, deterministic fake provider, chat service, CLI and GitHub Actions.

Initial foundation commit `5a1d07edc225ed6a8a2e96122c416b8bf670bbca` passed workflow `35357207396` on Ubuntu and Windows with 7 tests.

An added CLI smoke gate intentionally exercised the real child-process stdin/stdout path and exposed a sequence of input-lifecycle defects. Failed workflow runs `35357355471`, `35357456649` and `35357580182` were analyzed rather than bypassed.

Root cause: readline could begin consuming piped input before asynchronous session initialization completed and before the async iterator was ready. Commit `0da31b465846823cb09b8b64bfa48ca5879e0c58` moved readline initialization after session readiness and made the smoke harness wait for the readiness banner.

Workflow `35357816628` completed SUCCESS on Ubuntu and Windows including the CLI smoke path. ZOOID-0001 is complete; live provider integration remains a separate next task.

Detailed evidence: [ZOOID-0001 report](../reports/ZOOID-0001-basic-chat-foundation-report.md).

---

## 2026-09-18 — Implementation start and durable GitHub task history

ผู้ใช้อนุญาตให้เริ่มพัฒนา Zooid บน GitHub และกำหนดให้ทุกงานมีประวัติ Task อยู่ใน repository เพื่อให้ session ใหม่สามารถอ่านสถานะปัจจุบันและย้อนหลังได้

สร้าง task sequence `ZOOID-xxxx` ซึ่งเป็นเลขลำดับงานพัฒนา ไม่ใช่ software version และเก็บเหตุผล ขอบเขต progress evidence blocker และ exact next action ไว้ถาวร

---

## 2026-09-08 — New repository development plan

ผู้ใช้สร้าง funggier/Zooid-Agent ใหม่และขอเอกสารวางแผนครบด้าน

บันทึกแนวทางสร้างใหม่: Chat → Router → Ticket → Recovery → Context/Project → Group รวม Work Unit ที่ปรับโครงสร้างได้, ephemeral review, one-model scheduling, clean lifecycle และ extension contracts.

สถานะ software ณ checkpoint นี้ยัง NOT_STARTED.
