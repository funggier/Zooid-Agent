export const PROVIDER_CATALOG_REVISION = 1 as const;

export type ProviderPolicy = "enabled" | "disabled";
export type ProviderAdapterKind = "fake" | "openai-compatible";
export type ProviderDiscoveryKind = "ollama";

export interface ProviderModelConfig {
  id: string;
  policy: ProviderPolicy;
}

export interface ProviderDiscoveryConfig {
  kind: ProviderDiscoveryKind;
  baseUrl: string;
}

interface ProviderInstanceBase {
  id: string;
  policy: ProviderPolicy;
  models: ProviderModelConfig[];
  credentialRef?: string;
  discovery?: ProviderDiscoveryConfig;
}

export interface FakeProviderInstanceConfig extends ProviderInstanceBase {
  adapter: "fake";
  delayMs?: number;
}

export interface OpenAICompatibleProviderInstanceConfig
  extends ProviderInstanceBase {
  adapter: "openai-compatible";
  baseUrl: string;
  timeoutMs?: number;
}

export type ProviderInstanceConfig =
  | FakeProviderInstanceConfig
  | OpenAICompatibleProviderInstanceConfig;

export interface ProviderCatalog {
  revision: typeof PROVIDER_CATALOG_REVISION;
  providers: ProviderInstanceConfig[];
}

export type ProviderCatalogValidationErrorCode =
  | "invalid_catalog"
  | "unsupported_revision"
  | "unknown_field"
  | "invalid_provider_id"
  | "duplicate_provider"
  | "unsupported_adapter"
  | "invalid_policy"
  | "invalid_model_id"
  | "duplicate_model"
  | "invalid_base_url"
  | "invalid_timeout"
  | "invalid_delay"
  | "invalid_credential_ref"
  | "invalid_discovery";

export class ProviderCatalogValidationError extends Error {
  readonly code: ProviderCatalogValidationErrorCode;
  readonly path: string;

  constructor(
    code: ProviderCatalogValidationErrorCode,
    message: string,
    path = "$",
  ) {
    super(message);
    this.name = "ProviderCatalogValidationError";
    this.code = code;
    this.path = path;
  }
}

export function emptyProviderCatalog(): ProviderCatalog {
  return {
    revision: PROVIDER_CATALOG_REVISION,
    providers: [],
  };
}

export function validateProviderCatalog(
  value: unknown,
): asserts value is ProviderCatalog {
  const catalog = requireRecord(value, "invalid_catalog", "Catalog must be an object.", "$");
  assertAllowedKeys(catalog, ["revision", "providers"], "$");

  if (catalog.revision !== PROVIDER_CATALOG_REVISION) {
    throw new ProviderCatalogValidationError(
      "unsupported_revision",
      `Unsupported provider catalog revision: ${String(catalog.revision)}.`,
      "$.revision",
    );
  }

  if (!Array.isArray(catalog.providers)) {
    throw new ProviderCatalogValidationError(
      "invalid_catalog",
      "Catalog providers must be an array.",
      "$.providers",
    );
  }

  const providerIds = new Set<string>();

  for (let index = 0; index < catalog.providers.length; index += 1) {
    const path = `$.providers[${index}]`;
    const provider = requireRecord(
      catalog.providers[index],
      "invalid_catalog",
      "Provider entry must be an object.",
      path,
    );

    const adapter = provider.adapter;
    if (adapter !== "fake" && adapter !== "openai-compatible") {
      throw new ProviderCatalogValidationError(
        "unsupported_adapter",
        `Unsupported provider adapter: ${String(adapter)}.`,
        `${path}.adapter`,
      );
    }

    const allowed =
      adapter === "fake"
        ? [
            "id",
            "adapter",
            "policy",
            "models",
            "credentialRef",
            "discovery",
            "delayMs",
          ]
        : [
            "id",
            "adapter",
            "policy",
            "models",
            "credentialRef",
            "discovery",
            "baseUrl",
            "timeoutMs",
          ];
    assertAllowedKeys(provider, allowed, path);

    const providerId = requireProviderId(provider.id, `${path}.id`);
    if (providerIds.has(providerId)) {
      throw new ProviderCatalogValidationError(
        "duplicate_provider",
        `Duplicate provider ID: ${providerId}.`,
        `${path}.id`,
      );
    }
    providerIds.add(providerId);

    requirePolicy(provider.policy, `${path}.policy`);
    validateCredentialRef(provider.credentialRef, `${path}.credentialRef`);
    validateDiscovery(provider.discovery, `${path}.discovery`);
    validateModels(provider.models, path);

    if (adapter === "fake") {
      if (provider.delayMs !== undefined) {
        if (
          typeof provider.delayMs !== "number" ||
          !Number.isSafeInteger(provider.delayMs) ||
          provider.delayMs < 0 ||
          provider.delayMs > 60_000
        ) {
          throw new ProviderCatalogValidationError(
            "invalid_delay",
            "Fake provider delayMs must be an integer between 0 and 60000.",
            `${path}.delayMs`,
          );
        }
      }
      continue;
    }

    validateHttpUrl(provider.baseUrl, `${path}.baseUrl`, "invalid_base_url");

    if (provider.timeoutMs !== undefined) {
      if (
        typeof provider.timeoutMs !== "number" ||
        !Number.isSafeInteger(provider.timeoutMs) ||
        provider.timeoutMs < 1 ||
        provider.timeoutMs > 86_400_000
      ) {
        throw new ProviderCatalogValidationError(
          "invalid_timeout",
          "OpenAI-compatible timeoutMs must be an integer between 1 and 86400000.",
          `${path}.timeoutMs`,
        );
      }
    }
  }
}

function validateModels(value: unknown, providerPath: string): void {
  if (!Array.isArray(value)) {
    throw new ProviderCatalogValidationError(
      "invalid_catalog",
      "Provider models must be an array.",
      `${providerPath}.models`,
    );
  }

  const modelIds = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const path = `${providerPath}.models[${index}]`;
    const model = requireRecord(
      value[index],
      "invalid_catalog",
      "Model entry must be an object.",
      path,
    );
    assertAllowedKeys(model, ["id", "policy"], path);

    const id = requireModelId(model.id, `${path}.id`);
    if (modelIds.has(id)) {
      throw new ProviderCatalogValidationError(
        "duplicate_model",
        `Duplicate model ID: ${id}.`,
        `${path}.id`,
      );
    }
    modelIds.add(id);
    requirePolicy(model.policy, `${path}.policy`);
  }
}

function validateCredentialRef(value: unknown, path: string): void {
  if (value === undefined) {
    return;
  }

  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim() ||
    /[\r\n\0]/.test(value)
  ) {
    throw new ProviderCatalogValidationError(
      "invalid_credential_ref",
      "credentialRef must be a non-empty trimmed reference string.",
      path,
    );
  }
}

function validateDiscovery(value: unknown, path: string): void {
  if (value === undefined) {
    return;
  }

  const discovery = requireRecord(
    value,
    "invalid_discovery",
    "Discovery configuration must be an object.",
    path,
  );
  assertAllowedKeys(discovery, ["kind", "baseUrl"], path);

  if (discovery.kind !== "ollama") {
    throw new ProviderCatalogValidationError(
      "invalid_discovery",
      `Unsupported discovery kind: ${String(discovery.kind)}.`,
      `${path}.kind`,
    );
  }

  validateHttpUrl(discovery.baseUrl, `${path}.baseUrl`, "invalid_discovery");
}

function validateHttpUrl(
  value: unknown,
  path: string,
  code: "invalid_base_url" | "invalid_discovery",
): void {
  if (typeof value !== "string" || value.length === 0 || value !== value.trim()) {
    throw new ProviderCatalogValidationError(
      code,
      "Provider URL must be a non-empty trimmed HTTP(S) URL.",
      path,
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ProviderCatalogValidationError(
      code,
      "Provider URL must be a valid HTTP(S) URL.",
      path,
    );
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new ProviderCatalogValidationError(
      code,
      "Provider URL must use HTTP(S) and must not contain credentials, query parameters, or fragments.",
      path,
    );
  }
}

function requireProviderId(value: unknown, path: string): string {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)
  ) {
    throw new ProviderCatalogValidationError(
      "invalid_provider_id",
      "Provider ID must use letters, numbers, dot, underscore, or hyphen and must not be blank.",
      path,
    );
  }
  return value;
}

function requireModelId(value: unknown, path: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim() ||
    /[\r\n\0]/.test(value)
  ) {
    throw new ProviderCatalogValidationError(
      "invalid_model_id",
      "Model ID must be a non-empty trimmed string without control line breaks.",
      path,
    );
  }
  return value;
}

function requirePolicy(value: unknown, path: string): ProviderPolicy {
  if (value !== "enabled" && value !== "disabled") {
    throw new ProviderCatalogValidationError(
      "invalid_policy",
      "Policy must be 'enabled' or 'disabled'.",
      path,
    );
  }
  return value;
}

function requireRecord(
  value: unknown,
  code: "invalid_catalog" | "invalid_discovery",
  message: string,
  path: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProviderCatalogValidationError(code, message, path);
  }
  return value as Record<string, unknown>;
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      throw new ProviderCatalogValidationError(
        "unknown_field",
        `Unknown provider catalog field: ${key}.`,
        `${path}.${key}`,
      );
    }
  }
}
