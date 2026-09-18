import { stdin as input, stdout as output, stderr as errorOutput } from "node:process";
import { createInterface } from "node:readline";
import { ChatService, isAbortError } from "../chat/chat-service.ts";
import {
  describeProvider,
  loadProviderSettings,
  ProviderConfigError,
} from "../config/provider-settings.ts";
import { ProviderError } from "../providers/contracts.ts";
import { createProviderRuntime } from "../providers/provider-runtime.ts";
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
  const store = new FileSessionStore();
  const chat = new ChatService({
    provider: runtime.provider,
    store,
    model: runtime.model,
  });

  let session = await chat.createSession();
  let activeController: AbortController | undefined;

  output.write("Zooid — Powered by CogentNexus\n");
  output.write(`Provider: ${describeProvider(settings)}\n`);
  output.write(`Session: ${session.id}\n`);
  output.write("Commands: /new, /open <session-id>, /exit\n\n");

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
