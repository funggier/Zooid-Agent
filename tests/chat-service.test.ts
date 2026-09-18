import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ChatInputError, ChatService } from "../src/chat/chat-service.ts";
import { ProviderError } from "../src/providers/contracts.ts";
import { FakeProvider } from "../src/providers/fake-provider.ts";
import { FileSessionStore } from "../src/storage/file-session-store.ts";

async function createHarness(provider = new FakeProvider()) {
  const root = await mkdtemp(join(tmpdir(), "zooid-chat-"));
  const store = new FileSessionStore(root);
  const chat = new ChatService({ provider, store });
  const session = await chat.createSession();
  return {
    root,
    store,
    chat,
    session,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test("commits Thai multiline user text and one assistant response in order", async () => {
  const harness = await createHarness();
  try {
    const response = await harness.chat.sendText(harness.session.id, "สวัสดี\nโลก");
    assert.equal(response.text, "Echo: สวัสดี\nโลก");

    const persisted = await harness.store.load(harness.session.id);
    assert.deepEqual(persisted.messages.map((message) => message.sequence), [1, 2]);
    assert.deepEqual(persisted.messages.map((message) => message.status), ["complete", "complete"]);
    assert.equal(persisted.messages[0]?.text, "สวัสดี\nโลก");
  } finally {
    await harness.cleanup();
  }
});

test("cancellation preserves the user message and never appends a late assistant response", async () => {
  const harness = await createHarness(new FakeProvider({ delayMs: 80 }));
  try {
    const controller = new AbortController();
    const pending = harness.chat.sendText(harness.session.id, "cancel me", controller.signal);
    setTimeout(() => controller.abort(), 5);

    await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === "AbortError");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const persisted = await harness.store.load(harness.session.id);
    assert.equal(persisted.messages.length, 1);
    assert.equal(persisted.messages[0]?.status, "interrupted");
    assert.equal(persisted.messages[0]?.text, "cancel me");
  } finally {
    await harness.cleanup();
  }
});

test("provider failure keeps provenance and marks the user message failed", async () => {
  const harness = await createHarness(new FakeProvider({ failWith: "timeout" }));
  try {
    await assert.rejects(
      () => harness.chat.sendText(harness.session.id, "hello"),
      (error: unknown) => error instanceof ProviderError && error.kind === "timeout",
    );

    const persisted = await harness.store.load(harness.session.id);
    assert.equal(persisted.messages.length, 1);
    assert.equal(persisted.messages[0]?.status, "failed");
  } finally {
    await harness.cleanup();
  }
});


test("blank input is rejected without changing the transcript", async () => {
  const harness = await createHarness();
  try {
    await assert.rejects(
      () => harness.chat.sendText(harness.session.id, "   \n\t"),
      ChatInputError,
    );

    const persisted = await harness.store.load(harness.session.id);
    assert.equal(persisted.messages.length, 0);
  } finally {
    await harness.cleanup();
  }
});
