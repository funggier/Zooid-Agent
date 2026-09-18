import type {
  ProviderAdapterKind,
  ProviderCatalog,
  ProviderInstanceConfig,
} from "./provider-catalog.ts";
import { validateProviderCatalog } from "./provider-catalog.ts";
import type {
  ChatProvider,
  ProviderDescriptor,
} from "../contracts.ts";
import { FakeProvider } from "../fake-provider.ts";
import { OpenAICompatibleProvider } from "../openai-compatible-provider.ts";
import {
  ProviderRegistry,
  type ProviderRegistration,
} from "../registry.ts";
import { ProviderRouter } from "../router.ts";

export interface ProviderCredentialResolver {
  resolve(
    reference: string,
  ): string | undefined | Promise<string | undefined>;
}

export class ProviderCredentialResolutionError extends Error {
  readonly providerId: string;
  readonly credentialRef: string;

  constructor(providerId: string, credentialRef: string) {
    super(
      `Credential reference "${credentialRef}" could not be resolved for provider "${providerId}".`,
    );
    this.name = "ProviderCredentialResolutionError";
    this.providerId = providerId;
    this.credentialRef = credentialRef;
  }
}

export interface CatalogAdapterBuildInput {
  config: ProviderInstanceConfig;
  enabledModels: readonly string[];
  credential?: string;
}

export interface CatalogAdapterFactory {
  readonly adapter: ProviderAdapterKind;
  create(input: CatalogAdapterBuildInput): ProviderRegistration;
}

export interface ProviderCatalogRuntimeOptions {
  credentialResolver?: ProviderCredentialResolver;
  adapterFactories?: readonly CatalogAdapterFactory[];
}

export class ProviderCatalogRuntime {
  readonly registry: ProviderRegistry;
  readonly router: ProviderRouter;

  private readonly credentialResolver?: ProviderCredentialResolver;
  private readonly adapterFactories: Map<
    ProviderAdapterKind,
    CatalogAdapterFactory
  >;

  private constructor(options: ProviderCatalogRuntimeOptions) {
    this.registry = new ProviderRegistry();
    this.router = new ProviderRouter(this.registry);
    this.credentialResolver = options.credentialResolver;

    const factories =
      options.adapterFactories ?? defaultAdapterFactories();
    this.adapterFactories = new Map();

    for (const factory of factories) {
      this.adapterFactories.set(factory.adapter, factory);
    }
  }

  static async create(
    catalog: ProviderCatalog,
    options: ProviderCatalogRuntimeOptions = {},
  ): Promise<ProviderCatalogRuntime> {
    const runtime = new ProviderCatalogRuntime(options);
    await runtime.reload(catalog);
    return runtime;
  }

  async reload(catalog: ProviderCatalog): Promise<void> {
    validateProviderCatalog(catalog);
    const registrations = await this.buildRegistrations(catalog);

    // replaceAll validates every descriptor before mutating the live registry.
    // Existing in-flight requests already hold their resolved provider object,
    // while future Router resolutions observe this new registration set.
    this.registry.replaceAll(registrations);
  }

  private async buildRegistrations(
    catalog: ProviderCatalog,
  ): Promise<ProviderRegistration[]> {
    const registrations: ProviderRegistration[] = [];

    for (const config of catalog.providers) {
      if (config.policy !== "enabled") {
        continue;
      }

      const enabledModels = config.models
        .filter((model) => model.policy === "enabled")
        .map((model) => model.id);

      if (enabledModels.length === 0) {
        continue;
      }

      const credential = await this.resolveCredential(config);
      const factory = this.adapterFactories.get(config.adapter);

      if (!factory) {
        throw new Error(
          `No runtime adapter factory is registered for "${config.adapter}".`,
        );
      }

      registrations.push(
        factory.create({
          config,
          enabledModels,
          ...(credential !== undefined ? { credential } : {}),
        }),
      );
    }

    return registrations;
  }

  private async resolveCredential(
    config: ProviderInstanceConfig,
  ): Promise<string | undefined> {
    if (config.credentialRef === undefined) {
      return undefined;
    }

    const credential = await this.credentialResolver?.resolve(
      config.credentialRef,
    );

    if (
      typeof credential !== "string" ||
      credential.length === 0
    ) {
      throw new ProviderCredentialResolutionError(
        config.id,
        config.credentialRef,
      );
    }

    return credential;
  }
}

function defaultAdapterFactories(): CatalogAdapterFactory[] {
  return [
    {
      adapter: "fake",
      create(input) {
        if (input.config.adapter !== "fake") {
          throw new Error("Fake adapter factory received incompatible config.");
        }

        const provider = new FakeProvider({
          delayMs: input.config.delayMs,
        });

        return {
          provider,
          descriptor: baseDescriptor(
            input.config.id,
            "fake-r1",
            input.enabledModels,
          ),
        };
      },
    },
    {
      adapter: "openai-compatible",
      create(input) {
        if (input.config.adapter !== "openai-compatible") {
          throw new Error(
            "OpenAI-compatible adapter factory received incompatible config.",
          );
        }

        const firstModel = input.enabledModels[0];
        if (!firstModel) {
          throw new Error(
            "OpenAI-compatible adapter factory requires an enabled model.",
          );
        }

        const provider = new OpenAICompatibleProvider({
          kind: "openai-compatible",
          baseUrl: input.config.baseUrl,
          model: firstModel,
          ...(input.credential !== undefined
            ? { apiKey: input.credential }
            : {}),
          timeoutMs: input.config.timeoutMs ?? 120_000,
        });

        return {
          provider,
          descriptor: baseDescriptor(
            input.config.id,
            "openai-compatible-chat-completions-r1",
            input.enabledModels,
          ),
        };
      },
    },
  ];
}

function baseDescriptor(
  providerId: string,
  adapterRevision: string,
  models: readonly string[],
): ProviderDescriptor {
  return {
    providerId,
    adapterRevision,
    models: [...models],
    supportedRoles: ["user", "assistant"],
    contentTypes: ["text"],
    streamingSupport: false,
    usageSupport: false,
  };
}
