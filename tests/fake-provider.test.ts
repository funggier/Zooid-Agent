import assert from "node:assert/strict";
import test from "node:test";
import { createMessage } from "../src/domain/messages.ts";
import { FakeProvider } from "../src/providers/fake-provider.ts";

function request(signal?: AbortSignal) {
  return {
    requestId: "request-1",
    sessionId: "session-1",
    model: "fake-echo",
    messages: [
      createMessage({
        sessionId: "session-1",
        sequence: 1,
        role: "user" as const,
        text: "hello",
        status: "pending" as const,
      }),
    ],
    signal,
  };
}

test("fake provider is deterministic", async () => {
  const provider = new FakeProvider();
  const result = await provider.send(request());
  assert.equal(result.text, "Echo: hello");
  assert.equal(result.finishReason, "stop");
});

test("fake provider observes AbortSignal", async () => {
  const provider = new FakeProvider({ delayMs: 100 });
  const controller = new AbortController();
  const pending = provider.send(request(controller.signal));
  controller.abort();
  await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === "AbortError");
});
