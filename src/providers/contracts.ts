import type { ChatMessage } from "../domain/messages.ts";

export type ProviderErrorKind =
  | "auth"
  | "rate_limit"
  | "timeout"
  | "network"
  | "unsupported"
  | "invalid_response";

export interface ChatRequest {
  requestId: string;
  sessionId: string;
  model: string;
  messages: readonly ChatMessage[];
  signal?: AbortSignal;
}

export interface ChatResult {
  responseId: string;
  text: string;
  finishReason: "stop" | "length" | "other";
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface ChatProvider {
  readonly name: string;
  send(request: ChatRequest): Promise<ChatResult>;
}

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly retryAfterMs?: number;
  readonly safeMessage: string;

  constructor(
    kind: ProviderErrorKind,
    safeMessage: string,
    options: { retryAfterMs?: number; cause?: unknown } = {},
  ) {
    super(safeMessage, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ProviderError";
    this.kind = kind;
    this.retryAfterMs = options.retryAfterMs;
    this.safeMessage = safeMessage;
  }
}
