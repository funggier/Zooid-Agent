import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createMessage } from "../src/domain/messages.ts";
import type {
  OpenAICompatibleProviderInstanceConfig,
  ProviderModelConfig,
} from "../src/providers/config/provider-catalog.ts";
import { FileProviderCatalogStore } from "../src/providers/config/file-provider-catalog-store.ts";
import {
  ProviderConfigurationError,
  ProviderConfigurationService,
} from "../src/providers/config/provider-configuration-service.ts";
import { FileSessionStore } from "../src/storage/file-session-store.ts";

async function withHarness(
  run: (input: {
    root: string;
    catalogStore: FileProviderCatalogStore;
    service: ProviderConfigurationService;
  }) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "zooid-provider-config-service-"));
  const catalogStore = new FileProviderCatalogStore(root);
  const service = new ProviderConfigurationService(catalogStore);

  try {
    await run({ root, catalogStore, service });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function openAIProvider(
  id: string,
  models: readonly string[] = ["model-a"],
): OpenAICompatibleProviderInstanceConfig {
  return {
    id,
    adapter: "openai-compatible",
    policy: "enabled",
    baseUrl: "http://127.0.0.1:11434/v1",
    timeoutMs: 900_000,
    models: models.map((model) => ({
      id: model,
      policy: "enabled" as const,
    })),
  };
}

function model(
  id: string,
  policy: ProviderModelConfig["policy"] = "enabled",
): ProviderModelConfig {
  return { id, policy };
}

test("adds provider instances using an existing adapter without source-specific branching", async () => {
  await withHarness(async ({ service, catalogStore }) => {
    await service.addProvider(openAIProvider("local-ollama", ["qwen3.8:27b"]));

    const persisted = await catalogStore.load();
    assert.equal(persisted.providers.length, 1);
    assert.equal(persisted.providers[0]?.id, "local-ollama");
    assert.equal(persisted.providers[0]?.adapter, "openai-compatible");
    assert.equal(persisted.providers[0]?.models[0]?.id, "qwen3.8:27b");
  });
});

test("provider enable and disable are reversible policy changes", async () => {
  await withHarness(async ({ service, catalogStore }) => {
    await service.addProvider(openAIProvider("provider-a"));

    await service.setProviderPolicy("provider-a", "disabled");
    assert.equal(
      (await catalogStore.load()).providers[0]?.policy,
      "disabled",
    );

    await service.setProviderPolicy("provider-a", "enabled");
    assert.equal(
      (await catalogStore.load()).providers[0]?.policy,
      "enabled",
    );
  });
});

test("provider removal affects active catalog only and does not rewrite session attribution", async () => {
  await withHarness(async ({ root, service }) => {
    await service.addProvider(openAIProvider("provider-a"));

    const sessionStore = new FileSessionStore(root);
    const session = await sessionStore.create();
    session.messages.push(
      createMessage({
        sessionId: session.id,
        sequence: 1,
        role: "user",
        text: "historical request",
        status: "complete",
        route: {
          routeId: "route-historical",
          requestId: "request-historical",
          providerId: "provider-a",
          model: "model-a",
          adapterRevision: "openai-compatible-chat-completions-r1",
        },
      }),
    );
    await sessionStore.save(session);
    const sessionPath = sessionStore.pathFor(session.id);
    const before = await readFile(sessionPath, "utf8");

    await service.removeProvider("provider-a");

    assert.equal((await service.getCatalog()).providers.length, 0);
    assert.equal(await readFile(sessionPath, "utf8"), before);

    const reopened = await sessionStore.load(session.id);
    assert.equal(reopened.messages[0]?.route?.providerId, "provider-a");
    assert.equal(reopened.messages[0]?.route?.model, "model-a");
  });
});

test("model add, disable, enable and remove mutate only the selected provider", async () => {
  await withHarness(async ({ service }) => {
    await service.addProvider(openAIProvider("provider-a", ["model-a"]));
    await service.addProvider(openAIProvider("provider-b", ["model-b"]));

    await service.addModel("provider-a", model("model-c", "disabled"));
    await service.setModelPolicy("provider-a", "model-c", "enabled");
    await service.setModelPolicy("provider-a", "model-a", "disabled");
    await service.removeModel("provider-a", "model-c");

    const catalog = await service.getCatalog();
    assert.deepEqual(
      catalog.providers[0]?.models,
      [{ id: "model-a", policy: "disabled" }],
    );
    assert.deepEqual(
      catalog.providers[1]?.models,
      [{ id: "model-b", policy: "enabled" }],
    );
  });
});

test("duplicate and not-found operations fail explicitly without replacing existing configuration", async () => {
  await withHarness(async ({ service }) => {
    await service.addProvider(openAIProvider("provider-a", ["model-a"]));

    await assert.rejects(
      () => service.addProvider(openAIProvider("provider-a", ["different"])),
      (error: unknown) =>
        error instanceof ProviderConfigurationError &&
        error.code === "duplicate_provider",
    );

    await assert.rejects(
      () => service.addModel("provider-a", model("model-a")),
      (error: unknown) =>
        error instanceof ProviderConfigurationError &&
        error.code === "duplicate_model",
    );

    await assert.rejects(
      () => service.setProviderPolicy("missing", "disabled"),
      (error: unknown) =>
        error instanceof ProviderConfigurationError &&
        error.code === "provider_not_found",
    );

    await assert.rejects(
      () => service.setModelPolicy("provider-a", "missing", "disabled"),
      (error: unknown) =>
        error instanceof ProviderConfigurationError &&
        error.code === "model_not_found",
    );

    const catalog = await service.getCatalog();
    assert.deepEqual(catalog.providers[0]?.models, [
      { id: "model-a", policy: "enabled" },
    ]);
  });
});

test("concurrent mutations through one service serialize without lost updates", async () => {
  await withHarness(async ({ service }) => {
    await Promise.all([
      service.addProvider(openAIProvider("provider-a", ["model-a"])),
      service.addProvider(openAIProvider("provider-b", ["model-b"])),
      service.addProvider(openAIProvider("provider-c", ["model-c"])),
    ]);

    await Promise.all([
      service.addModel("provider-a", model("model-a2")),
      service.addModel("provider-a", model("model-a3")),
      service.setProviderPolicy("provider-b", "disabled"),
    ]);

    const catalog = await service.getCatalog();
    assert.deepEqual(
      catalog.providers.map((provider) => provider.id),
      ["provider-a", "provider-b", "provider-c"],
    );
    assert.deepEqual(
      catalog.providers[0]?.models.map((entry) => entry.id),
      ["model-a", "model-a2", "model-a3"],
    );
    assert.equal(catalog.providers[1]?.policy, "disabled");
  });
});

test("configuration service does not invent observed availability state", async () => {
  await withHarness(async ({ service }) => {
    await service.addProvider(openAIProvider("provider-a"));

    const catalog = await service.getCatalog();
    const provider = catalog.providers[0] as unknown as Record<string, unknown>;
    const configuredModel = catalog.providers[0]?.models[0] as unknown as Record<
      string,
      unknown
    >;

    assert.equal("availability" in provider, false);
    assert.equal("availability" in configuredModel, false);
    assert.equal(provider.policy, "enabled");
    assert.equal(configuredModel.policy, "enabled");
  });
});

test("a qwen3.8:27b-only provider remains a valid configuration regardless of expected latency", async () => {
  await withHarness(async ({ service }) => {
    await service.addProvider(
      openAIProvider("slow-only", ["qwen3.8:27b"]),
    );

    const catalog = await service.getCatalog();
    assert.deepEqual(catalog.providers[0]?.models, [
      { id: "qwen3.8:27b", policy: "enabled" },
    ]);
  });
});
