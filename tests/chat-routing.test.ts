import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  ChatService,
  RouteRejectedError,
} from "../src/chat/chat-service.ts";
import type {
  ChatProvider,
  ChatRequest,
  ChatResult,
  ProviderDescriptor,
  ProviderErrorKind,
} from "../src/providers/contracts.ts";
import { ProviderError } from "../src/providers/contracts.ts";
import { ProviderRegistry } from "../src/providers/registry.ts";
import { ProviderRouter } from "../src/providers/router.ts";
import { FileSessionStore } from "../src/storage/file-session-store.ts";

class RecordingProvider implements ChatProvider {
  readonly name: string;
  readonly requests: ChatRequest[] = [];
  private readonly prefix: string;
  private readonly failWith?: ProviderErrorKind;

  constructor(input: {
    name: string;
    prefix: string;
    failWith?: ProviderErrorKind;
  }) {
    this.name = input.name;
    this.prefix = input.prefix;
    this.failWith = input.failWith;
  }

  async send(request: ChatRequest): Promise<ChatResult> {
    this.requests.push({
      ...request,
      messages: request.messages.map((message) => ({ ...message })),
    });

    if (this.failWith) {
      throw new ProviderError(
        this.failWith,
        `Recording provider failure: ${this.failWith}`,
      );
    }

    const lastUser = [...request.messages]
      .reverse()
      .find((message) => message.role === "user");

    return {
      responseId: `${this.name}-response-${this.requests.length}`,
      text: `${this.prefix}${lastUser?.text ?? ""}`,
      finishReason: "stop",
    };
  }
}

class GateProvider implements ChatProvider {
  readonly name = "gate-a";
  calls = 0;
  readonly started: Promise<void>;
  private startedResolve!: () => void;
  private readonly releasePromise: Promise<void>;
  private releaseResolve!: () => void;

  constructor() {
    this.started = new Promise((resolve) => {
      this.startedResolve = resolve;
    });
    this.releasePromise = new Promise((resolve) => {
      this.releaseResolve = resolve;
    });
  }

  release(): void {
    this.releaseResolve();
  }

  async send(request: ChatRequest): Promise<ChatResult> {
    this.calls += 1;
    this.startedResolve();
    await this.releasePromise;

    return {
      responseId: "gate-a-response",
      text: `A:${request.messages.at(-1)?.text ?? ""}`,
      finishReason: "stop",
    };
  }
}

function descriptor(input: {
  providerId: string;
  model: string;
  adapterRevision: string;
  contentTypes?: readonly ("text" | "image")[];
}): ProviderDescriptor {
  return {
    providerId: input.providerId,
    adapterRevision: input.adapterRevision,
    models: [input.model],
    supportedRoles: ["user", "assistant"],
    contentTypes: input.contentTypes ?? ["text"],
    streamingSupport: false,
    contextLimit: 32768,
    usageSupport: false,
  };
}

async function createHarness(input?: {
  providerA?: ChatProvider;
  providerB?: ChatProvider;
  providerAContentTypes?: readonly ("text" | "image")[];
}) {
  const root = await mkdtemp(join(tmpdir(), "zooid-routing-chat-"));
  const store = new FileSessionStore(root);
  const providerA =
    input?.providerA ??
    new RecordingProvider({ name: "adapter-a", prefix: "A:" });
  const providerB =
    input?.providerB ??
    new RecordingProvider({ name: "adapter-b", prefix: "B:" });

  const registry = new ProviderRegistry([
    {
      descriptor: descriptor({
        providerId: "provider-a",
        model: "model-a",
        adapterRevision: "adapter-a-r1",
        contentTypes: input?.providerAContentTypes,
      }),
      provider: providerA,
    },
    {
      descriptor: descriptor({
        providerId: "provider-b",
        model: "model-b",
        adapterRevision: "adapter-b-r1",
        contentTypes: ["text"],
      }),
      provider: providerB,
    },
  ]);

  const router = new ProviderRouter(registry);
  const chat = new ChatService({
    router,
    store,
    route: {
      providerId: "provider-a",
      model: "model-a",
    },
  });
  const session = await chat.createSession();

  return {
    root,
    store,
    chat,
    session,
    providerA,
    providerB,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test("A -> B -> A keeps one session, neutral history and durable route attribution", async () => {
  const harness = await createHarness();

  try {
    const first = await harness.chat.sendText(harness.session.id, "one");

    harness.chat.selectRoute({
      providerId: "provider-b",
      model: "model-b",
    });
    const second = await harness.chat.sendText(harness.session.id, "two");

    harness.chat.selectRoute({
      providerId: "provider-a",
      model: "model-a",
    });
    const third = await harness.chat.sendText(harness.session.id, "three");

    assert.equal(first.text, "A:one");
    assert.equal(second.text, "B:two");
    assert.equal(third.text, "A:three");

    const persisted = await harness.store.load(harness.session.id);
    assert.equal(persisted.id, harness.session.id);
    assert.deepEqual(
      persisted.messages.map((message) => message.sequence),
      [1, 2, 3, 4, 5, 6],
    );
    assert.deepEqual(
      persisted.messages.map((message) => message.route?.providerId),
      [
        "provider-a",
        "provider-a",
        "provider-b",
        "provider-b",
        "provider-a",
        "provider-a",
      ],
    );
    assert.deepEqual(
      persisted.messages.map((message) => message.route?.model),
      ["model-a", "model-a", "model-b", "model-b", "model-a", "model-a"],
    );

    const recordingB = harness.providerB as RecordingProvider;
    assert.equal(recordingB.requests.length, 1);
    assert.deepEqual(
      recordingB.requests[0]?.messages.map((message) => ({
        role: message.role,
        text: message.text,
      })),
      [
        { role: "user", text: "one" },
        { role: "assistant", text: "A:one" },
        { role: "user", text: "two" },
      ],
    );

    assert.equal(persisted.messages[1]?.providerResponseId, "adapter-a-response-1");
    assert.equal(persisted.messages[3]?.providerResponseId, "adapter-b-response-1");
    assert.equal(persisted.messages[5]?.providerResponseId, "adapter-a-response-2");
  } finally {
    await harness.cleanup();
  }
});

test("route snapshot is persisted before dispatch and does not drift when next route changes in-flight", async () => {
  const gate = new GateProvider();
  const providerB = new RecordingProvider({
    name: "adapter-b",
    prefix: "B:",
  });
  const harness = await createHarness({
    providerA: gate,
    providerB,
  });

  try {
    const pending = harness.chat.sendText(harness.session.id, "slow");
    await gate.started;

    const inFlight = await harness.store.load(harness.session.id);
    assert.equal(inFlight.messages.length, 1);
    assert.equal(inFlight.messages[0]?.status, "pending");
    assert.equal(inFlight.messages[0]?.route?.providerId, "provider-a");
    assert.equal(inFlight.messages[0]?.route?.model, "model-a");

    harness.chat.selectRoute({
      providerId: "provider-b",
      model: "model-b",
    });

    gate.release();
    const firstResponse = await pending;
    assert.equal(firstResponse.route?.providerId, "provider-a");
    assert.equal(firstResponse.route?.model, "model-a");

    const nextResponse = await harness.chat.sendText(
      harness.session.id,
      "next",
    );
    assert.equal(nextResponse.route?.providerId, "provider-b");
    assert.equal(nextResponse.route?.model, "model-b");
  } finally {
    gate.release();
    await harness.cleanup();
  }
});

test("provider failure preserves the selected route and never silently dispatches another provider", async () => {
  const providerA = new RecordingProvider({
    name: "adapter-a",
    prefix: "A:",
    failWith: "timeout",
  });
  const providerB = new RecordingProvider({
    name: "adapter-b",
    prefix: "B:",
  });
  const harness = await createHarness({ providerA, providerB });

  try {
    await assert.rejects(
      () => harness.chat.sendText(harness.session.id, "fail here"),
      (error: unknown) =>
        error instanceof ProviderError && error.kind === "timeout",
    );

    assert.equal(providerA.requests.length, 1);
    assert.equal(providerB.requests.length, 0);

    const persisted = await harness.store.load(harness.session.id);
    assert.equal(persisted.messages.length, 1);
    assert.equal(persisted.messages[0]?.status, "failed");
    assert.equal(persisted.messages[0]?.route?.providerId, "provider-a");
    assert.equal(persisted.messages[0]?.route?.model, "model-a");
  } finally {
    await harness.cleanup();
  }
});

test("incompatible next route is rejected before transcript mutation or provider dispatch", async () => {
  const harness = await createHarness({
    providerAContentTypes: ["text"],
  });

  try {
    harness.chat.selectRoute({
      providerId: "provider-a",
      model: "model-a",
      requiredCapabilities: {
        contentTypes: ["image"],
      },
    });

    await assert.rejects(
      () => harness.chat.sendText(harness.session.id, "image request"),
      (error: unknown) =>
        error instanceof RouteRejectedError &&
        error.decision.reason === "missing_capabilities:content:image",
    );

    const persisted = await harness.store.load(harness.session.id);
    assert.equal(persisted.messages.length, 0);
    assert.equal((harness.providerA as RecordingProvider).requests.length, 0);
    assert.equal((harness.providerB as RecordingProvider).requests.length, 0);
  } finally {
    await harness.cleanup();
  }
});

test("current route selection is explicit and changing it does not mutate persisted history", async () => {
  const harness = await createHarness();

  try {
    await harness.chat.sendText(harness.session.id, "first");
    const before = await harness.store.load(harness.session.id);

    harness.chat.selectRoute({
      providerId: "provider-b",
      model: "model-b",
    });

    assert.deepEqual(harness.chat.getSelectedRoute(), {
      providerId: "provider-b",
      model: "model-b",
      requiredCapabilities: {
        roles: ["user", "assistant"],
        contentTypes: ["text"],
      },
    });

    const after = await harness.store.load(harness.session.id);
    assert.deepEqual(after, before);
  } finally {
    await harness.cleanup();
  }
});
