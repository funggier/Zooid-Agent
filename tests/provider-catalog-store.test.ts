import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  PROVIDER_CATALOG_REVISION,
  ProviderCatalogValidationError,
  type ProviderCatalog,
  validateProviderCatalog,
} from "../src/providers/config/provider-catalog.ts";
import {
  FileProviderCatalogStore,
  ProviderCatalogCorruptError,
} from "../src/providers/config/file-provider-catalog-store.ts";

async function withRoot(
  run: (root: string, store: FileProviderCatalogStore) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "zooid-provider-catalog-"));
  try {
    await run(root, new FileProviderCatalogStore(root));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function sampleCatalog(): ProviderCatalog {
  return {
    revision: PROVIDER_CATALOG_REVISION,
    providers: [
      {
        id: "local-ollama",
        adapter: "openai-compatible",
        policy: "enabled",
        baseUrl: "http://127.0.0.1:11434/v1",
        timeoutMs: 900_000,
        models: [
          { id: "qwen3:1.7b", policy: "disabled" },
          { id: "qwen3.8:27b", policy: "enabled" },
        ],
        discovery: {
          kind: "ollama",
          baseUrl: "http://127.0.0.1:11434",
        },
      },
      {
        id: "development-fake",
        adapter: "fake",
        policy: "disabled",
        delayMs: 5,
        credentialRef: "unused-reference-for-contract-test",
        models: [{ id: "fake-echo", policy: "enabled" }],
      },
    ],
  };
}

test("missing provider catalog opens as an empty revision-1 catalog", async () => {
  await withRoot(async (_root, store) => {
    assert.deepEqual(await store.load(), {
      revision: 1,
      providers: [],
    });
  });
});

test("save and reopen preserves provider/model ordering and policy", async () => {
  await withRoot(async (_root, store) => {
    const catalog = sampleCatalog();
    await store.save(catalog);

    const reopened = await new FileProviderCatalogStore(store.root).load();
    assert.deepEqual(reopened, catalog);
    assert.deepEqual(
      reopened.providers.map((provider) => provider.id),
      ["local-ollama", "development-fake"],
    );
    assert.deepEqual(
      reopened.providers[0]?.models.map((model) => model.id),
      ["qwen3:1.7b", "qwen3.8:27b"],
    );
  });
});

test("catalog save leaves one valid durable file and no temporary files", async () => {
  await withRoot(async (_root, store) => {
    await store.save(sampleCatalog());

    const entries = await readdir(store.providersDir);
    assert.deepEqual(entries, ["catalog.json"]);

    const parsed = JSON.parse(await readFile(store.catalogPath, "utf8"));
    assert.equal(parsed.revision, 1);
    assert.equal(parsed.providers.length, 2);
  });
});

test("validation rejects blank/duplicate provider IDs and duplicate/blank model IDs", () => {
  const blankProvider = sampleCatalog();
  blankProvider.providers[0]!.id = " ";
  assert.throws(
    () => validateProviderCatalog(blankProvider),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "invalid_provider_id",
  );

  const duplicateProvider = sampleCatalog();
  duplicateProvider.providers[1]!.id = "local-ollama";
  assert.throws(
    () => validateProviderCatalog(duplicateProvider),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "duplicate_provider",
  );

  const blankModel = sampleCatalog();
  blankModel.providers[0]!.models[0]!.id = "";
  assert.throws(
    () => validateProviderCatalog(blankModel),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "invalid_model_id",
  );

  const duplicateModel = sampleCatalog();
  duplicateModel.providers[0]!.models[1]!.id = "qwen3:1.7b";
  assert.throws(
    () => validateProviderCatalog(duplicateModel),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "duplicate_model",
  );
});

test("validation rejects unknown adapters and embedded endpoint credentials", () => {
  const unknownAdapter = sampleCatalog() as unknown as {
    revision: number;
    providers: Array<Record<string, unknown>>;
  };
  unknownAdapter.providers[0]!.adapter = "mystery-adapter";

  assert.throws(
    () => validateProviderCatalog(unknownAdapter),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "unsupported_adapter",
  );

  const credentialUrl = sampleCatalog();
  const provider = credentialUrl.providers[0];
  if (provider?.adapter !== "openai-compatible") {
    throw new Error("fixture provider is not openai-compatible");
  }
  provider.baseUrl = "http://user:password@127.0.0.1:11434/v1";

  assert.throws(
    () => validateProviderCatalog(credentialUrl),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "invalid_base_url",
  );
});

test("catalog schema has no raw secret field and rejects secret-shaped unknown fields", () => {
  const catalog = sampleCatalog() as unknown as {
    revision: number;
    providers: Array<Record<string, unknown>>;
  };
  catalog.providers[0]!.apiKey = "must-not-be-persisted";

  assert.throws(
    () => validateProviderCatalog(catalog),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "unknown_field",
  );

  const valid = sampleCatalog();
  assert.equal(valid.providers[1]?.credentialRef, "unused-reference-for-contract-test");
  validateProviderCatalog(valid);
});

test("corrupt or schema-invalid catalog is preserved and reported, not overwritten", async () => {
  await withRoot(async (_root, store) => {
    await store.ensureDirectory();
    await writeFile(store.catalogPath, "{broken-json", "utf8");

    await assert.rejects(() => store.load(), ProviderCatalogCorruptError);
    assert.equal(await readFile(store.catalogPath, "utf8"), "{broken-json");

    const invalid = JSON.stringify({
      revision: 1,
      providers: [{ id: "bad", adapter: "unknown", policy: "enabled", models: [] }],
    });
    await writeFile(store.catalogPath, invalid, "utf8");

    await assert.rejects(() => store.load(), ProviderCatalogCorruptError);
    assert.equal(await readFile(store.catalogPath, "utf8"), invalid);
  });
});

test("unsupported catalog revision is rejected explicitly", () => {
  assert.throws(
    () =>
      validateProviderCatalog({
        revision: 2,
        providers: [],
      }),
    (error: unknown) =>
      error instanceof ProviderCatalogValidationError &&
      error.code === "unsupported_revision",
  );
});
