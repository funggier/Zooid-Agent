export type ProviderKind = "fake" | "openai-compatible";

export interface FakeProviderSettings {
  kind: "fake";
  model: "fake-echo";
  delayMs: number;
}

export interface OpenAICompatibleProviderSettings {
  kind: "openai-compatible";
  baseUrl: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
}

export type ProviderSettings = FakeProviderSettings | OpenAICompatibleProviderSettings;

export class ProviderConfigError extends Error {
  readonly key: string;

  constructor(key: string, message: string) {
    super(message);
    this.name = "ProviderConfigError";
    this.key = key;
  }
}

export function loadProviderSettings(
  env: NodeJS.ProcessEnv = process.env,
): ProviderSettings {
  const kind = env.ZOOID_PROVIDER?.trim() || "fake";

  if (kind === "fake") {
    return {
      kind: "fake",
      model: "fake-echo",
      delayMs: 50,
    };
  }

  if (kind !== "openai-compatible") {
    throw new ProviderConfigError(
      "ZOOID_PROVIDER",
      "ZOOID_PROVIDER must be either 'fake' or 'openai-compatible'.",
    );
  }

  const rawBaseUrl = requireSetting(env, "ZOOID_PROVIDER_BASE_URL");
  const model = requireSetting(env, "ZOOID_PROVIDER_MODEL");
  const apiKey = env.ZOOID_PROVIDER_API_KEY?.trim() || undefined;
  const timeoutMs = parseTimeout(env.ZOOID_PROVIDER_TIMEOUT_MS);

  return {
    kind,
    baseUrl: normalizeBaseUrl(rawBaseUrl),
    model,
    apiKey,
    timeoutMs,
  };
}

export function describeProvider(settings: ProviderSettings): string {
  if (settings.kind === "fake") {
    return "fake (deterministic development mode)";
  }

  return `openai-compatible model=${settings.model} base=${settings.baseUrl}`;
}

function requireSetting(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new ProviderConfigError(key, `Missing required provider setting: ${key}`);
  }
  return value;
}

function normalizeBaseUrl(raw: string): string {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw new ProviderConfigError(
      "ZOOID_PROVIDER_BASE_URL",
      "ZOOID_PROVIDER_BASE_URL must be a valid HTTP(S) URL.",
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ProviderConfigError(
      "ZOOID_PROVIDER_BASE_URL",
      "ZOOID_PROVIDER_BASE_URL must use http or https.",
    );
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new ProviderConfigError(
      "ZOOID_PROVIDER_BASE_URL",
      "ZOOID_PROVIDER_BASE_URL must not contain credentials, query parameters, or a fragment.",
    );
  }

  return url.toString().replace(/\/+$/, "");
}

function parseTimeout(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") {
    return 120_000;
  }

  const value = raw.trim();
  if (!/^\d+$/.test(value)) {
    throw new ProviderConfigError(
      "ZOOID_PROVIDER_TIMEOUT_MS",
      "ZOOID_PROVIDER_TIMEOUT_MS must be a positive integer.",
    );
  }

  const timeout = Number(value);
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 900_000) {
    throw new ProviderConfigError(
      "ZOOID_PROVIDER_TIMEOUT_MS",
      "ZOOID_PROVIDER_TIMEOUT_MS must be between 1 and 900000.",
    );
  }

  return timeout;
}
