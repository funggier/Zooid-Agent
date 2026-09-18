import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ChatService } from "../src/chat/chat-service.ts";
import type { ProviderCatalog } from "../src/providers/config/provider-catalog.ts";
import {
  ProviderCatalogRuntime,
  ProviderCredentialResolutionError,
  type ProviderCredentialResolver,
} from "../src/providers/config/provider-catalog-runtime.ts";
import { ProviderRegistryError } from "../src/providers/registry.ts";
import { createProviderRuntime } from "../src/providers/provider-runtime.ts";
import { FileSessionStore } from "../src/storage/file-session-store.ts";

function fakeCatalog(input?: {
  providerA?: "enabled" | "disabled";
  modelA2?: "enabled" | "disabled";
  includeB?: boolean;
}): ProviderCatalog {
  return {
    revision: 1,
    providers: [
      {
        id: "provider-a",
        adapter: "fake",
        policy: input?.providerA ?? "enabled",
        delayMs: 80,
        models: [
          { id: "model-a", policy: "enabled" },
          { id: "model-a2", policy: input?.modelA2 ?? "disabled" },
        ],
      },
      ...(input?.includeB
        ? [
            {
              id: "provider-b",
              adapter: "fake" as const,
              policy: "enabled" as const,
              delayMs: 0,
              models: [{ id: "model-b", policy: "enabled" as const }],
            },
          ]
        : []),
    ],
  };
}

test("catalog runtime registers only enabled providers and enabled models", async () => {
  const catalog: ProviderCatalog = {
    revision: 1,
    providers: [
      ...fakeCatalog({ modelA2: "disabled" }).providers,
      {
        id: "provider-disabled",
        adapter: "fake",
        policy: "disabled",
        models: [{ id: "model-disabled", policy: "enabled" }],
      },
      {
        id: "provider-no-models",
        adapter: "fake",
        policy: "enabled",
        models: [{ id: "model-off", policy: "disabled" }],
      },
    ],
  };

  const runtime = await ProviderCatalogRuntime.create(catalog);

  assert.equal(
    runtime.registry.resolve("provider-a", "model-a").provider.name,
    "fake",
  );

  assert.throws(
    () => runtime.registry.resolve("provider-a", "model-a2"),
    (error: unknown) =>
      error instanceof ProviderRegistryError &&
      error.code === "unsupported_model",
  );

  for (const providerId of ["provider-disabled", "provider-no-models"]) {
    assert.throws(
      () => runtime.registry.get(providerId),
      (error: unknown) =>
        error instanceof ProviderRegistryError &&
        error.code === "unknown_provider",
    );
  }
});

test("provider instance identity is independent from the adapter implementation", async () => {
  const catalog: ProviderCatalog = {
    revision: 1,
    providers: [
      {
        id: "local-ollama",
        adapter: "openai-compatible",
        policy: "enabled",
        baseUrl: "http://127.0.0.1:11434/v1",
        timeoutMs: 900_000,
        models: [
          { id: "qwen3:1.7b", policy: "enabled" },
          { id: "qwen3.8:27b", policy: "enabled" },
        ],
      },
    ],
  };

  const runtime = await ProviderCatalogRuntime.create(catalog);
  const registration = runtime.registry.resolve(
    "local-ollama",
    "qwen3.8:27b",
  );

  assert.equal(registration.provider.name, "openai-compatible");
  assert.equal(registration.descriptor.providerId, "local-ollama");
  assert.deepEqual(registration.descriptor.models, [
    "qwen3:1.7b",
    "qwen3.8:27b",
  ]);
  assert.equal(
    registration.descriptor.adapterRevision,
    "openai-compatible-chat-completions-r1",
  );
});

test("credential references resolve through a separate resolver boundary", async () => {
  const calls: string[] = [];
  const resolver: ProviderCredentialResolver = {
    async resolve(reference) {
      calls.push(reference);
      return reference === "openai-main" ? "fixture-secret" : undefined;
    },
  };

  const catalog: ProviderCatalog = {
    revision: 1,
    providers: [
      {
        id: "remote",
        adapter: "openai-compatible",
        policy: "enabled",
        baseUrl: "https://example.invalid/v1",
        credentialRef: "openai-main",
        models: [{ id: "remote-model", policy: "enabled" }],
      },
    ],
  };

  const runtime = await ProviderCatalogRuntime.create(catalog, {
    credentialResolver: resolver,
  });

  assert.deepEqual(calls, ["openai-main"]);
  assert.equal(runtime.registry.get("remote").provider.name, "openai-compatible");
});

test("unresolved configured credential fails before registry replacement", async () => {
  const runtime = await ProviderCatalogRuntime.create(fakeCatalog());

  const catalog: ProviderCatalog = {
    revision: 1,
    providers: [
      {
        id: "remote",
        adapter: "openai-compatible",
        policy: "enabled",
        baseUrl: "https://example.invalid/v1",
        credentialRef: "missing-secret",
        models: [{ id: "remote-model", policy: "enabled" }],
      },
    ],
  };

  await assert.rejects(
    () => runtime.reload(catalog),
    (error: unknown) =>
      error instanceof ProviderCredentialResolutionError &&
      error.credentialRef === "missing-secret",
  );

  assert.equal(
    runtime.registry.resolve("provider-a", "model-a").provider.name,
    "fake",
  );
  assert.throws(
    () => runtime.registry.get("remote"),
    (error: unknown) =>
      error instanceof ProviderRegistryError &&
      error.code === "unknown_provider",
  );
});

test("catalog reload updates future routes while an in-flight route retains its original provider", async () => {
  const root = await mkdtemp(join(tmpdir(), "zooid-catalog-runtime-"));

  try {
    const runtime = await ProviderCatalogRuntime.create(fakeCatalog());
    const store = new FileSessionStore(root);
    const chat = new ChatService({
      router: runtime.router,
      store,
      route: {
        providerId: "provider-a",
        model: "model-a",
      },
    });
    const session = await chat.createSession();

    const pending = chat.sendText(session.id, "slow request");
    await waitForPending(store, session.id);

    await runtime.reload({
      revision: 1,
      providers: [
        {
          id: "provider-b",
          adapter: "fake",
          policy: "enabled",
          models: [{ id: "model-b", policy: "enabled" }],
        },
      ],
    });

    chat.selectRoute({
      providerId: "provider-b",
      model: "model-b",
    });

    const first = await pending;
    assert.equal(first.route?.providerId, "provider-a");
    assert.equal(first.route?.model, "model-a");

    const second = await chat.sendText(session.id, "future request");
    assert.equal(second.route?.providerId, "provider-b");
    assert.equal(second.route?.model, "model-b");

    const persisted = await store.load(session.id);
    assert.deepEqual(
      persisted.messages.map((message) => message.route?.providerId),
      ["provider-a", "provider-a", "provider-b", "provider-b"],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy environment-style provider runtime remains available", () => {
  const legacy = createProviderRuntime({
    kind: "fake",
    model: "fake-echo",
    delayMs: 0,
  });

  assert.equal(legacy.providerId, "fake");
  assert.equal(legacy.model, "fake-echo");
  assert.equal(legacy.provider.name, "fake");
});

async function waitForPending(
  store: FileSessionStore,
  sessionId: string,
): Promise<void> {
  const deadline = Date.now() + 2_000;

  while (Date.now() < deadline) {
    const session = await store.load(sessionId);
    if (
      session.messages.length === 1 &&
      session.messages[0]?.status === "pending"
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  throw new Error("Timed out waiting for persisted pending routed message.");
}
