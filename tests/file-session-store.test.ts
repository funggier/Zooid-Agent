import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createMessage } from "../src/domain/messages.ts";
import { FileSessionStore, SessionCorruptError } from "../src/storage/file-session-store.ts";

async function withStore(run: (store: FileSessionStore, root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "zooid-store-"));
  try {
    await run(new FileSessionStore(root), root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("persists and reopens ordered session history", async () => {
  await withStore(async (store) => {
    const session = await store.create();
    session.messages.push(
      createMessage({ sessionId: session.id, sequence: 1, role: "user", text: "สวัสดี", status: "complete" }),
      createMessage({ sessionId: session.id, sequence: 2, role: "assistant", text: "สวัสดีครับ", status: "complete" }),
    );
    await store.save(session);

    const reopened = await new FileSessionStore(store.root).load(session.id);
    assert.deepEqual(reopened.messages.map((message) => message.sequence), [1, 2]);
    assert.equal(reopened.messages[0]?.text, "สวัสดี");
    assert.equal(reopened.messages[1]?.text, "สวัสดีครับ");
  });
});

test("preserves a corrupt session file instead of overwriting it", async () => {
  await withStore(async (store) => {
    const session = await store.create();
    const path = store.pathFor(session.id);
    await writeFile(path, "{broken-json", "utf8");

    await assert.rejects(() => store.load(session.id), SessionCorruptError);
    assert.equal(await readFile(path, "utf8"), "{broken-json");
  });
});


test("supports a data root whose path contains spaces", async () => {
  const parent = await mkdtemp(join(tmpdir(), "zooid-space-parent-"));
  const root = join(parent, "data root with spaces");

  try {
    const store = new FileSessionStore(root);
    const session = await store.create();
    const reopened = await store.load(session.id);
    assert.equal(reopened.id, session.id);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
