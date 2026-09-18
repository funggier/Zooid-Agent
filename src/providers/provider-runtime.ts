import type { ProviderSettings } from "../config/provider-settings.ts";
import type { ChatProvider } from "./contracts.ts";
import { FakeProvider } from "./fake-provider.ts";
import { OpenAICompatibleProvider } from "./openai-compatible-provider.ts";

export interface ProviderRuntime {
  provider: ChatProvider;
  model: string;
}

export function createProviderRuntime(settings: ProviderSettings): ProviderRuntime {
  if (settings.kind === "fake") {
    return {
      provider: new FakeProvider({ delayMs: settings.delayMs }),
      model: settings.model,
    };
  }

  return {
    provider: new OpenAICompatibleProvider(settings),
    model: settings.model,
  };
}
