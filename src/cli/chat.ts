import {
  stdin as input,
  stdout as output,
  stderr as errorOutput,
} from "node:process";
import { createInterface } from "node:readline";
import {
  ChatService,
  isAbortError,
  RouteRejectedError,
} from "../chat/chat-service.ts";
import {
  describeProvider,
  loadProviderSettings,
  ProviderConfigError,
} from "../config/provider-settings.ts";
import { ProviderError } from "../providers/contracts.ts";
import { createProviderRuntime } from "../providers/provider-runtime.ts";
import {
  ProviderRegistry,
  ProviderRegistryError,
} from "../providers/registry.ts";
import { ProviderRouter } from "../providers/router.ts";
import { FileSessionStore } from "../storage/file-session-store.ts";

try {
  await run();
} catch (error) {
  if (error instanceof ProviderConfigError) {
    errorOutput.write(`Zooid configuration error: ${error.message}\n`);
    process.exitCode = 2;
  } else if (error instanceof Error) {
    errorOutput.write(`Zooid fatal error: ${error.message}\n`);
    process.exitCode = 1;
  } else {
    errorOutput.write("Zooid fatal error: unknown error\n");
    process.exitCode = 1;
  }
}

async function run(): Promise<void> {
  const settings = loadProviderSettings();
  const runtime = createProviderRuntime(settings);
  const registry = new ProviderRegistry([
    {
      descriptor: runtime.descriptor,
      provider: runtime.provider,
    },
  ]);
  const router = new ProviderRouter(registry);
  const store = new FileSessionStore();
  const chat = new ChatService({
    router,
    store,
    route: {
      providerId: runtime.providerId,
      model: runtime.model,
    },
  });

  let session = await chat.createSession();
  let activeController: AbortController | undefined;

  output.write("Zooid — Powered by CogentNexus\n");
  output.write(`Provider: ${describeProvider(settings)}\n`);
  output.write(`Session: ${session.id}\n`);
  output.write(
    "Commands: /new, /open <session-id>, /exit, /route, /route <provider-id> <model>\n\n",
  );

  const readline = createInterface({
    input,
    output,
    terminal: Boolean(input.isTTY && output.isTTY),
  });

  readline.on("SIGINT", () => {
    if (activeController) {
      activeController.abort();
      output.write("\n");
      return;
    }

    readline.close();
  });

  if (input.isTTY) {
    readline.setPrompt("you> ");
    readline.prompt();
  }

  try {
    for await (const text of readline) {
      const trimmed = text.trim();

      if (trimmed === "/exit") {
        break;
      }

      if (trimmed === "/new") {
        session = await chat.createSession();
        output.write(`Opened new session: ${session.id}\n`);
        promptIfInteractive(readline);
        continue;
      }

      if (trimmed.startsWith("/open ")) {
        const sessionId = trimmed.slice("/open ".length).trim();

        try {
          session = await chat.openSession(sessionId);
          output.write(
            `Opened session: ${session.id} (${session.messages.length} messages)\n`,
          );
        } catch (error) {
          output.write(
            `zooid> error: ${error instanceof Error ? error.message : "unknown error"}\n`,
          );
        }

        promptIfInteractive(readline);
        continue;
      }

      if (trimmed === "/route") {
        writeCurrentRoute(chat);
        promptIfInteractive(readline);
        continue;
      }

      if (trimmed.startsWith("/route ")) {
        const routeText = trimmed.slice("/route ".length).trim();
        const separator = routeText.search(/\s/);

        if (separator <= 0) {
          output.write(
            "zooid> route error: usage /route <provider-id> <model>\n",
          );
          promptIfInteractive(readline);
          continue;
        }

        const providerId = routeText.slice(0, separator).trim();
        const model = routeText.slice(separator).trim();

        if (!providerId || !model) {
          output.write(
            "zooid> route error: usage /route <provider-id> <model>\n",
          );
          promptIfInteractive(readline);
          continue;
        }

        try {
          registry.resolve(providerId, model);
          chat.selectRoute({ providerId, model });
          output.write(
            `Selected route for next request: ${providerId}/${model}\n`,
          );
        } catch (error) {
          if (error instanceof ProviderRegistryError) {
            output.write(`zooid> route error: ${error.message}\n`);
          } else {
            throw error;
          }
        }

        promptIfInteractive(readline);
        continue;
      }

      if (trimmed.length === 0) {
        promptIfInteractive(readline);
        continue;
      }

      activeController = new AbortController();

      try {
        const response = await chat.sendText(
          session.id,
          text,
          activeController.signal,
        );
        output.write(`zooid> ${response.text}\n`);
      } catch (error) {
        if (isAbortError(error)) {
          output.write("zooid> request cancelled\n");
        } else if (error instanceof RouteRejectedError) {
          output.write(
            `zooid> route rejected: ${error.decision.reason}\n`,
          );
        } else if (error instanceof ProviderError) {
          output.write(
            `zooid> provider error (${error.kind}): ${error.safeMessage}\n`,
          );
        } else if (error instanceof Error) {
          output.write(`zooid> error: ${error.message}\n`);
        } else {
          output.write("zooid> unknown error\n");
        }
      } finally {
        activeController = undefined;
      }

      promptIfInteractive(readline);
    }
  } finally {
    readline.close();
  }

  function promptIfInteractive(
    interfaceHandle: ReturnType<typeof createInterface>,
  ): void {
    if (input.isTTY) {
      interfaceHandle.prompt();
    }
  }
}

function writeCurrentRoute(chat: ChatService): void {
  const route = chat.getSelectedRoute();
  if (!route) {
    output.write("Current route: none\n");
    return;
  }

  output.write(`Current route: ${route.providerId}/${route.model}\n`);
}
