import type { ProviderSettings } from "../config/provider-settings.ts";
import type {
  ChatProvider,
  ProviderDescriptor,
} from "./contracts.ts";
import { FakeProvider } from "./fake-provider.ts";
import { OpenAICompatibleProvider } from "./openai-compatible-provider.ts";

export interface ProviderRuntime {
  providerId: string;
  provider: ChatProvider;
  model: string;
  descriptor: ProviderDescriptor;
}

export function createProviderRuntime(
  settings: ProviderSettings,
): ProviderRuntime {
  if (settings.kind === "fake") {
    const providerId = "fake";
    return {
      providerId,
      provider: new FakeProvider({ delayMs: settings.delayMs }),
      model: settings.model,
      descriptor: {
        providerId,
        adapterRevision: "fake-r1",
        models: [settings.model],
        supportedRoles: ["user", "assistant"],
        contentTypes: ["text"],
        streamingSupport: false,
        usageSupport: false,
      },
    };
  }

  const providerId = "openai-compatible";
  return {
    providerId,
    provider: new OpenAICompatibleProvider(settings),
    model: settings.model,
    descriptor: {
      providerId,
      adapterRevision: "openai-compatible-chat-completions-r1",
      models: [settings.model],
      supportedRoles: ["user", "assistant"],
      contentTypes: ["text"],
      streamingSupport: false,
      usageSupport: false,
    },
  };
}
