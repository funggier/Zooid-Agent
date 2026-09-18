import { randomUUID } from "node:crypto";
import type { ChatProvider, ChatRequest, ChatResult, ProviderErrorKind } from "./contracts.ts";
import { ProviderError } from "./contracts.ts";

export interface FakeProviderOptions {
  delayMs?: number;
  failWith?: ProviderErrorKind;
  prefix?: string;
}

export class FakeProvider implements ChatProvider {
  readonly name = "fake";
  private readonly delayMs: number;
  private readonly failWith?: ProviderErrorKind;
  private readonly prefix: string;

  constructor(options: FakeProviderOptions = {}) {
    this.delayMs = options.delayMs ?? 0;
    this.failWith = options.failWith;
    this.prefix = options.prefix ?? "Echo: ";
  }

  async send(request: ChatRequest): Promise<ChatResult> {
    await waitForDelay(this.delayMs, request.signal);

    if (request.signal?.aborted) {
      throw abortError();
    }

    if (this.failWith) {
      throw new ProviderError(this.failWith, `Fake provider failure: ${this.failWith}`);
    }

    const lastUserMessage = [...request.messages].reverse().find((message) => message.role === "user");
    if (!lastUserMessage) {
      throw new ProviderError("invalid_response", "No user message was supplied to the provider.");
    }

    return {
      responseId: randomUUID(),
      text: `${this.prefix}${lastUserMessage.text}`,
      finishReason: "stop",
    };
  }
}

function waitForDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(abortError());
  }

  if (delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function abortError(): DOMException {
  return new DOMException("Provider request cancelled.", "AbortError");
}
