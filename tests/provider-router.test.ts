import assert from "node:assert/strict";
import test from "node:test";
import type {
  ChatProvider,
  ProviderDescriptor,
} from "../src/providers/contracts.ts";
import {
  ProviderRegistry,
  ProviderRegistryError,
} from "../src/providers/registry.ts";
import { ProviderRouter } from "../src/providers/router.ts";

class StubProvider implements ChatProvider {
  readonly name: string;
  calls = 0;

  constructor(name: string) {
    this.name = name;
  }

  async send(): Promise<never> {
    this.calls += 1;
    throw new Error("router tests must not dispatch providers");
  }
}

function descriptor(input: Partial<ProviderDescriptor> & Pick<ProviderDescriptor, "providerId">): ProviderDescriptor {
  return {
    providerId: input.providerId,
    adapterRevision: input.adapterRevision ?? "test-r1",
    models: input.models ?? ["model-a"],
    supportedRoles: input.supportedRoles ?? ["user", "assistant"],
    contentTypes: input.contentTypes ?? ["text"],
    streamingSupport: input.streamingSupport ?? false,
    contextLimit: input.contextLimit ?? 8192,
    usageSupport: input.usageSupport ?? false,
  };
}

function createRegistry() {
  const providerA = new StubProvider("adapter-a");
  const providerB = new StubProvider("adapter-b");

  const registry = new ProviderRegistry([
    {
      descriptor: descriptor({
        providerId: "provider-a",
        adapterRevision: "adapter-a-r2",
        models: ["model-a"],
        contentTypes: ["text"],
        contextLimit: 8192,
      }),
      provider: providerA,
    },
    {
      descriptor: descriptor({
        providerId: "provider-b",
        adapterRevision: "adapter-b-r7",
        models: ["model-b"],
        contentTypes: ["text", "image"],
        streamingSupport: true,
        contextLimit: 32768,
        usageSupport: true,
      }),
      provider: providerB,
    },
  ]);

  return { registry, providerA, providerB };
}

test("manual route decision is deterministic for identical validated input", () => {
  const { registry } = createRegistry();
  const router = new ProviderRouter(registry);
  const request = {
    requestId: "request-1",
    sessionId: "session-1",
    selectedProvider: "provider-b",
    model: "model-b",
    requiredCapabilities: {
      roles: ["user", "assistant"] as const,
      contentTypes: ["text"] as const,
      streaming: true,
      usage: true,
      minimumContextLimit: 16000,
    },
  };

  const first = router.resolve(request);
  const second = router.resolve(request);

  assert.equal(first.accepted, true);
  assert.deepEqual(first, second);

  if (first.accepted) {
    assert.equal(first.decision.requestId, "request-1");
    assert.equal(first.decision.sessionId, "session-1");
    assert.equal(first.decision.providerId, "provider-b");
    assert.equal(first.decision.model, "model-b");
    assert.equal(first.decision.adapterRevision, "adapter-b-r7");
    assert.equal(first.decision.compatibilityResult.compatible, true);
    assert.equal(first.decision.reason, "explicit_selection");
    assert.equal(first.provider.name, "adapter-b");
  }
});

test("incompatible explicit route is rejected without automatic fallback or dispatch", () => {
  const { registry, providerA, providerB } = createRegistry();
  const router = new ProviderRouter(registry);

  const result = router.resolve({
    requestId: "request-2",
    sessionId: "session-1",
    selectedProvider: "provider-a",
    model: "model-a",
    requiredCapabilities: {
      contentTypes: ["image"],
    },
  });

  assert.equal(result.accepted, false);
  assert.equal(result.decision.providerId, "provider-a");
  assert.equal(result.decision.compatibilityResult.compatible, false);
  assert.deepEqual(result.decision.compatibilityResult.missing, ["content:image"]);
  assert.equal(result.decision.reason, "missing_capabilities:content:image");
  assert.equal(providerA.calls, 0);
  assert.equal(providerB.calls, 0);
});

test("unknown providers and unsupported models fail before dispatch", () => {
  const { registry, providerA, providerB } = createRegistry();
  const router = new ProviderRouter(registry);

  assert.throws(
    () =>
      router.resolve({
        requestId: "request-3",
        sessionId: "session-1",
        selectedProvider: "missing",
        model: "model-x",
        requiredCapabilities: {},
      }),
    (error: unknown) => error instanceof ProviderRegistryError && error.code === "unknown_provider",
  );

  assert.throws(
    () =>
      router.resolve({
        requestId: "request-4",
        sessionId: "session-1",
        selectedProvider: "provider-a",
        model: "model-b",
        requiredCapabilities: {},
      }),
    (error: unknown) => error instanceof ProviderRegistryError && error.code === "unsupported_model",
  );

  assert.equal(providerA.calls, 0);
  assert.equal(providerB.calls, 0);
});

test("changing the explicit provider changes the route snapshot instead of rewriting history", () => {
  const { registry } = createRegistry();
  const router = new ProviderRouter(registry);

  const routeA = router.resolve({
    requestId: "request-5",
    sessionId: "session-1",
    selectedProvider: "provider-a",
    model: "model-a",
    requiredCapabilities: { contentTypes: ["text"] },
  });
  const routeB = router.resolve({
    requestId: "request-6",
    sessionId: "session-1",
    selectedProvider: "provider-b",
    model: "model-b",
    requiredCapabilities: { contentTypes: ["text"] },
  });

  assert.equal(routeA.accepted, true);
  assert.equal(routeB.accepted, true);
  assert.notEqual(routeA.decision.routeId, routeB.decision.routeId);
  assert.equal(routeA.decision.sessionId, routeB.decision.sessionId);
  assert.equal(routeA.decision.providerId, "provider-a");
  assert.equal(routeB.decision.providerId, "provider-b");
});
