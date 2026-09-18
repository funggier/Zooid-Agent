import type {
  ProviderCatalog,
  ProviderInstanceConfig,
  ProviderModelConfig,
  ProviderPolicy,
} from "./provider-catalog.ts";
import { FileProviderCatalogStore } from "./file-provider-catalog-store.ts";

export type ProviderConfigurationErrorCode =
  | "duplicate_provider"
  | "provider_not_found"
  | "duplicate_model"
  | "model_not_found";

export class ProviderConfigurationError extends Error {
  readonly code: ProviderConfigurationErrorCode;
  readonly providerId?: string;
  readonly modelId?: string;

  constructor(
    code: ProviderConfigurationErrorCode,
    message: string,
    details: { providerId?: string; modelId?: string } = {},
  ) {
    super(message);
    this.name = "ProviderConfigurationError";
    this.code = code;
    this.providerId = details.providerId;
    this.modelId = details.modelId;
  }
}

export class ProviderConfigurationService {
  private readonly store: FileProviderCatalogStore;
  private mutationTail: Promise<void> = Promise.resolve();

  constructor(store: FileProviderCatalogStore) {
    this.store = store;
  }

  async getCatalog(): Promise<ProviderCatalog> {
    await this.mutationTail;
    return this.store.load();
  }

  addProvider(provider: ProviderInstanceConfig): Promise<ProviderCatalog> {
    const candidate = structuredClone(provider);

    return this.mutate((catalog) => {
      if (catalog.providers.some((entry) => entry.id === candidate.id)) {
        throw new ProviderConfigurationError(
          "duplicate_provider",
          `Provider "${candidate.id}" already exists.`,
          { providerId: candidate.id },
        );
      }

      catalog.providers.push(candidate);
    });
  }

  setProviderPolicy(
    providerId: string,
    policy: ProviderPolicy,
  ): Promise<ProviderCatalog> {
    return this.mutate((catalog) => {
      const provider = requireProvider(catalog, providerId);
      provider.policy = policy;
    });
  }

  removeProvider(providerId: string): Promise<ProviderCatalog> {
    return this.mutate((catalog) => {
      const index = catalog.providers.findIndex(
        (provider) => provider.id === providerId,
      );

      if (index < 0) {
        throw providerNotFound(providerId);
      }

      catalog.providers.splice(index, 1);
    });
  }

  addModel(
    providerId: string,
    model: ProviderModelConfig,
  ): Promise<ProviderCatalog> {
    const candidate = structuredClone(model);

    return this.mutate((catalog) => {
      const provider = requireProvider(catalog, providerId);

      if (provider.models.some((entry) => entry.id === candidate.id)) {
        throw new ProviderConfigurationError(
          "duplicate_model",
          `Model "${candidate.id}" already exists on provider "${providerId}".`,
          { providerId, modelId: candidate.id },
        );
      }

      provider.models.push(candidate);
    });
  }

  setModelPolicy(
    providerId: string,
    modelId: string,
    policy: ProviderPolicy,
  ): Promise<ProviderCatalog> {
    return this.mutate((catalog) => {
      const provider = requireProvider(catalog, providerId);
      const model = provider.models.find((entry) => entry.id === modelId);

      if (!model) {
        throw modelNotFound(providerId, modelId);
      }

      model.policy = policy;
    });
  }

  removeModel(
    providerId: string,
    modelId: string,
  ): Promise<ProviderCatalog> {
    return this.mutate((catalog) => {
      const provider = requireProvider(catalog, providerId);
      const index = provider.models.findIndex(
        (entry) => entry.id === modelId,
      );

      if (index < 0) {
        throw modelNotFound(providerId, modelId);
      }

      provider.models.splice(index, 1);
    });
  }

  private mutate(
    operation: (catalog: ProviderCatalog) => void | Promise<void>,
  ): Promise<ProviderCatalog> {
    const result = this.mutationTail.then(async () => {
      const catalog = await this.store.load();
      await operation(catalog);
      await this.store.save(catalog);
      return catalog;
    });

    this.mutationTail = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }
}

function requireProvider(
  catalog: ProviderCatalog,
  providerId: string,
): ProviderInstanceConfig {
  const provider = catalog.providers.find(
    (entry) => entry.id === providerId,
  );

  if (!provider) {
    throw providerNotFound(providerId);
  }

  return provider;
}

function providerNotFound(
  providerId: string,
): ProviderConfigurationError {
  return new ProviderConfigurationError(
    "provider_not_found",
    `Provider "${providerId}" was not found.`,
    { providerId },
  );
}

function modelNotFound(
  providerId: string,
  modelId: string,
): ProviderConfigurationError {
  return new ProviderConfigurationError(
    "model_not_found",
    `Model "${modelId}" was not found on provider "${providerId}".`,
    { providerId, modelId },
  );
}
