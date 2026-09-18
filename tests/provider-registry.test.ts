import assert from "node:assert/strict";
import test from "node:test";
import type {
  ChatProvider,
  ProviderDescriptor,
  ProviderRequirements,
} from "../src/providers/contracts.ts";
import {
  ProviderRegistry,
  ProviderRegistryError,
  evaluateProviderCompatibility,
} from "../src/providers/registry.ts";

class StubProvider implements ChatProvider {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  async send(): Promise<never> {
    throw new Error("not dispatched in registry tests");
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

test("registry accepts multiple providers with different capabilities", () => {
  const registry = new ProviderRegistry();

  registry.register({
    descriptor: descriptor({ providerId: "provider-a", streamingSupport: false, contextLimit: 8192 }),
    provider: new StubProvider("provider-a"),
  });
  registry.register({
    descriptor: descriptor({
      providerId: "provider-b",
      models: ["model-b"],
      streamingSupport: true,
      contextLimit: 32768,
      usageSupport: true,
    }),
    provider: new StubProvider("provider-b"),
  });

  assert.equal(registry.get("provider-a").descriptor.contextLimit, 8192);
  assert.equal(registry.resolve("provider-b", "model-b").provider.name, "provider-b");
});

test("registry rejects duplicate and invalid provider descriptors", () => {
  const registry = new ProviderRegistry();
  registry.register({
    descriptor: descriptor({ providerId: "provider-a" }),
    provider: new StubProvider("provider-a"),
  });

  assert.throws(
    () =>
      registry.register({
        descriptor: descriptor({ providerId: "provider-a", models: ["other"] }),
        provider: new StubProvider("provider-a"),
      }),
    (error: unknown) => error instanceof ProviderRegistryError && error.code === "duplicate_provider",
  );

  assert.throws(
    () =>
      new ProviderRegistry([
        {
          descriptor: descriptor({ providerId: "", models: ["model-a"] }),
          provider: new StubProvider(""),
        },
      ]),
    (error: unknown) => error instanceof ProviderRegistryError && error.code === "invalid_descriptor",
  );

  assert.throws(
    () =>
      new ProviderRegistry([
        {
          descriptor: descriptor({ providerId: "provider-empty-models", models: [] }),
          provider: new StubProvider("provider-empty-models"),
        },
      ]),
    (error: unknown) => error instanceof ProviderRegistryError && error.code === "invalid_descriptor",
  );
});

test("registry rejects unknown providers and unsupported models before dispatch", () => {
  const registry = new ProviderRegistry([
    {
      descriptor: descriptor({ providerId: "provider-a", models: ["model-a"] }),
      provider: new StubProvider("provider-a"),
    },
  ]);

  assert.throws(
    () => registry.get("missing"),
    (error: unknown) => error instanceof ProviderRegistryError && error.code === "unknown_provider",
  );

  assert.throws(
    () => registry.resolve("provider-a", "model-b"),
    (error: unknown) => error instanceof ProviderRegistryError && error.code === "unsupported_model",
  );
});

test("capability evaluation reports unsupported requirements explicitly", () => {
  const target = descriptor({
    providerId: "provider-a",
    supportedRoles: ["user", "assistant"],
    contentTypes: ["text"],
    streamingSupport: false,
    contextLimit: 8192,
    usageSupport: false,
  });

  const requirements: ProviderRequirements = {
    roles: ["user", "assistant"],
    contentTypes: ["text", "image"],
    streaming: true,
    usage: true,
    minimumContextLimit: 16384,
  };

  const result = evaluateProviderCompatibility(target, requirements);

  assert.equal(result.compatible, false);
  assert.deepEqual(result.missing, [
    "content:image",
    "streaming",
    "usage",
    "context>=16384",
  ]);
});

test("capability evaluation accepts a fully supported request", () => {
  const target = descriptor({
    providerId: "provider-b",
    contentTypes: ["text", "image"],
    streamingSupport: true,
    contextLimit: 32768,
    usageSupport: true,
  });

  const requirements: ProviderRequirements = {
    roles: ["user", "assistant"],
    contentTypes: ["text"],
    streaming: true,
    usage: true,
    minimumContextLimit: 16000,
  };

  assert.deepEqual(evaluateProviderCompatibility(target, requirements), {
    compatible: true,
    missing: [],
  });
});
