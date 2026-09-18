import assert from "node:assert/strict";
import test from "node:test";
import {
  loadProviderSettings,
  ProviderConfigError,
} from "../src/config/provider-settings.ts";

test("provider settings default to deterministic fake mode", () => {
  assert.deepEqual(loadProviderSettings({}), {
    kind: "fake",
    model: "fake-echo",
    delayMs: 50,
  });
});

test("openai-compatible settings normalize base URL and keep API key optional", () => {
  const settings = loadProviderSettings({
    ZOOID_PROVIDER: "openai-compatible",
    ZOOID_PROVIDER_BASE_URL: "http://127.0.0.1:11434/v1/",
    ZOOID_PROVIDER_MODEL: "gpt-oss:20b",
    ZOOID_PROVIDER_TIMEOUT_MS: "2500",
  });

  assert.deepEqual(settings, {
    kind: "openai-compatible",
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "gpt-oss:20b",
    apiKey: undefined,
    timeoutMs: 2500,
  });
});

test("provider settings fail before dispatch when required values are missing", () => {
  assert.throws(
    () =>
      loadProviderSettings({
        ZOOID_PROVIDER: "openai-compatible",
        ZOOID_PROVIDER_MODEL: "model",
      }),
    (error: unknown) =>
      error instanceof ProviderConfigError &&
      error.key === "ZOOID_PROVIDER_BASE_URL" &&
      !error.message.includes("undefined"),
  );
});

test("provider base URL rejects embedded credentials and timeout is bounded", () => {
  assert.throws(
    () =>
      loadProviderSettings({
        ZOOID_PROVIDER: "openai-compatible",
        ZOOID_PROVIDER_BASE_URL: "https://user:secret@example.test/v1",
        ZOOID_PROVIDER_MODEL: "model",
      }),
    ProviderConfigError,
  );

  assert.throws(
    () =>
      loadProviderSettings({
        ZOOID_PROVIDER: "openai-compatible",
        ZOOID_PROVIDER_BASE_URL: "https://example.test/v1",
        ZOOID_PROVIDER_MODEL: "model",
        ZOOID_PROVIDER_TIMEOUT_MS: "0",
      }),
    ProviderConfigError,
  );
});
