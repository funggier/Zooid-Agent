import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { ChatService, isAbortError } from "../chat/chat-service.ts";
import { ProviderError } from "../providers/contracts.ts";
import { FakeProvider } from "../providers/fake-provider.ts";
import { FileSessionStore } from "../storage/file-session-store.ts";

const store = new FileSessionStore();
const provider = new FakeProvider({ delayMs: 50 });
const chat = new ChatService({ provider, store });
const readline = createInterface({ input, output });

let session = await chat.createSession();

output.write("Zooid — Powered by CogentNexus\n");
output.write("Provider: fake (deterministic development mode)\n");
output.write(`Session: ${session.id}\n`);
output.write("Commands: /new, /open <session-id>, /exit\n\n");

try {
  while (true) {
    const text = await readline.question("you> ");
    const trimmed = text.trim();

    if (trimmed === "/exit") {
      break;
    }

    if (trimmed === "/new") {
      session = await chat.createSession();
      output.write(`Opened new session: ${session.id}\n`);
      continue;
    }

    if (trimmed.startsWith("/open ")) {
      const sessionId = trimmed.slice("/open ".length).trim();
      session = await chat.openSession(sessionId);
      output.write(`Opened session: ${session.id} (${session.messages.length} messages)\n`);
      continue;
    }

    if (trimmed.length === 0) {
      continue;
    }

    const controller = new AbortController();
    const onSigint = () => controller.abort();
    process.once("SIGINT", onSigint);

    try {
      const response = await chat.sendText(session.id, text, controller.signal);
      output.write(`zooid> ${response.text}\n`);
    } catch (error) {
      if (isAbortError(error)) {
        output.write("zooid> request cancelled\n");
      } else if (error instanceof ProviderError) {
        output.write(`zooid> provider error (${error.kind}): ${error.safeMessage}\n`);
      } else if (error instanceof Error) {
        output.write(`zooid> error: ${error.message}\n`);
      } else {
        output.write("zooid> unknown error\n");
      }
    } finally {
      process.removeListener("SIGINT", onSigint);
    }
  }
} finally {
  readline.close();
}
