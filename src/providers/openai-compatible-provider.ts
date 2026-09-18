import type { ChatMessage } from "../domain/messages.ts";
import type { OpenAICompatibleProviderSettings } from "../config/provider-settings.ts";
import type { ChatProvider, ChatRequest, ChatResult, ProviderErrorKind } from "./contracts.ts";
import { ProviderError } from "./contracts.ts";

type FetchLike = typeof fetch;

interface CompatibleResponse {
  id?: unknown;
  choices?: unknown;
  usage?: unknown;
}

export class OpenAICompatibleProvider implements ChatProvider {
  readonly name = "openai-compatible";

  constructor(
    private readonly settings: OpenAICompatibleProviderSettings,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  async send(request: ChatRequest): Promise<ChatResult> {
    const messages = selectRequestMessages(request.messages);
    const controller = new AbortController();
    let timedOut = false;

    if (request.signal?.aborted) {
      throw abortError();
    }

    const onUserAbort = () => controller.abort();
    request.signal?.addEventListener("abort", onUserAbort, { once: true });

    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.settings.timeoutMs);

    try {
      let response: Response;

      try {
        response = await this.fetchImpl(
          `${this.settings.baseUrl}/chat/completions`,
          {
            method: "POST",
            headers: requestHeaders(this.settings.apiKey),
            body: JSON.stringify({
              model: request.model,
              messages,
              stream: false,
            }),
            signal: controller.signal,
          },
        );
      } catch (error) {
        if (request.signal?.aborted) {
          throw abortError();
        }

        if (timedOut) {
          throw new ProviderError(
            "timeout",
            `Provider request timed out after ${this.settings.timeoutMs} ms.`,
            { cause: error },
          );
        }

        throw new ProviderError(
          "network",
          "Provider request could not reach the configured endpoint.",
          { cause: error },
        );
      }

      if (!response.ok) {
        throw errorFromStatus(response);
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error) {
        throw new ProviderError(
          "invalid_response",
          "Provider returned a response that was not valid JSON.",
          { cause: error },
        );
      }

      return parseCompatibleResponse(payload);
    } finally {
      clearTimeout(timeout);
      request.signal?.removeEventListener("abort", onUserAbort);
    }
  }
}

function requestHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

function selectRequestMessages(
  messages: readonly ChatMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  const current = messages.at(-1);

  if (!current || current.role !== "user" || current.status !== "pending") {
    throw new ProviderError(
      "invalid_response",
      "Chat request must end with the current pending user message.",
    );
  }

  return messages
    .filter((message) => message.status === "complete" || message.id === current.id)
    .map((message) => ({
      role: message.role,
      content: message.text,
    }));
}

function parseCompatibleResponse(payload: unknown): ChatResult {
  if (!payload || typeof payload !== "object") {
    throw invalidSchema();
  }

  const response = payload as CompatibleResponse;
  if (typeof response.id !== "string" || response.id.length === 0) {
    throw invalidSchema();
  }

  if (!Array.isArray(response.choices) || response.choices.length === 0) {
    throw invalidSchema();
  }

  const first = response.choices[0];
  if (!first || typeof first !== "object") {
    throw invalidSchema();
  }

  const choice = first as {
    message?: unknown;
    finish_reason?: unknown;
  };
  if (!choice.message || typeof choice.message !== "object") {
    throw invalidSchema();
  }

  const message = choice.message as { content?: unknown };
  if (typeof message.content !== "string") {
    throw invalidSchema();
  }

  const finishReason =
    choice.finish_reason === "stop"
      ? "stop"
      : choice.finish_reason === "length"
        ? "length"
        : "other";

  const usage = parseUsage(response.usage);

  return {
    responseId: response.id,
    text: message.content,
    finishReason,
    ...(usage ? { usage } : {}),
  };
}

function parseUsage(
  value: unknown,
): ChatResult["usage"] | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const usage = value as {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
  };

  const inputTokens =
    typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined;
  const outputTokens =
    typeof usage.completion_tokens === "number"
      ? usage.completion_tokens
      : undefined;

  if (inputTokens === undefined && outputTokens === undefined) {
    return undefined;
  }

  return { inputTokens, outputTokens };
}

function errorFromStatus(response: Response): ProviderError {
  const kind: ProviderErrorKind =
    response.status === 401 || response.status === 403
      ? "auth"
      : response.status === 429
        ? "rate_limit"
        : response.status === 408 || response.status === 504
          ? "timeout"
          : response.status === 404 || response.status === 405
            ? "unsupported"
            : response.status >= 500
              ? "network"
              : "invalid_response";

  return new ProviderError(
    kind,
    `Provider returned HTTP ${response.status}.`,
    {
      retryAfterMs: parseRetryAfter(response.headers.get("retry-after")),
    },
  );
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  if (/^\d+$/.test(value.trim())) {
    return Number(value.trim()) * 1_000;
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return undefined;
  }

  return Math.max(0, timestamp - Date.now());
}

function invalidSchema(): ProviderError {
  return new ProviderError(
    "invalid_response",
    "Provider response did not match the expected Chat Completions shape.",
  );
}

function abortError(): DOMException {
  return new DOMException("Provider request cancelled.", "AbortError");
}
