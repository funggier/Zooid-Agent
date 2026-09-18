import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createMessage, type ChatMessage } from "../src/domain/messages.ts";
import { ProviderError } from "../src/providers/contracts.ts";
import { OpenAICompatibleProvider } from "../src/providers/openai-compatible-provider.ts";

test("maps eligible history to Chat Completions and parses success", async () => {
  await withServer(async (request, response) => {
    assert.equal(request.method, "POST");
    assert.equal(request.url, "/v1/chat/completions");
    assert.equal(request.headers.authorization, "Bearer test-secret");

    const body = JSON.parse(await readBody(request)) as {
      model: string;
      stream: boolean;
      messages: Array<{ role: string; content: string }>;
    };

    assert.equal(body.model, "fixture-model");
    assert.equal(body.stream, false);
    assert.deepEqual(body.messages, [
      { role: "user", content: "first" },
      { role: "assistant", content: "answer" },
      { role: "user", content: "current" },
    ]);

    json(response, 200, {
      id: "chatcmpl-fixture",
      choices: [
        {
          message: { role: "assistant", content: "fixture response" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 12, completion_tokens: 3 },
    });
  }, async (baseUrl) => {
    const provider = new OpenAICompatibleProvider({
      kind: "openai-compatible",
      baseUrl,
      model: "fixture-model",
      apiKey: "test-secret",
      timeoutMs: 1_000,
    });

    const result = await provider.send(requestWithHistory());
    assert.equal(result.responseId, "chatcmpl-fixture");
    assert.equal(result.text, "fixture response");
    assert.equal(result.finishReason, "stop");
    assert.deepEqual(result.usage, { inputTokens: 12, outputTokens: 3 });
  });
});

test("does not send Authorization when API key is absent", async () => {
  await withServer(async (request, response) => {
    assert.equal(request.headers.authorization, undefined);
    await readBody(request);
    json(response, 200, successPayload());
  }, async (baseUrl) => {
    const provider = providerFor(baseUrl);
    await provider.send(currentOnlyRequest());
  });
});

test("normalizes auth and rate-limit HTTP status without exposing response bodies", async () => {
  await withServer(async (request, response) => {
    await readBody(request);
    response.statusCode = 401;
    response.end("secret upstream diagnostic");
  }, async (baseUrl) => {
    const provider = providerFor(baseUrl);
    await assert.rejects(
      () => provider.send(currentOnlyRequest()),
      (error: unknown) =>
        error instanceof ProviderError &&
        error.kind === "auth" &&
        !error.safeMessage.includes("secret upstream diagnostic"),
    );
  });

  await withServer(async (request, response) => {
    await readBody(request);
    response.statusCode = 429;
    response.setHeader("Retry-After", "2");
    response.end("rate limited");
  }, async (baseUrl) => {
    const provider = providerFor(baseUrl);
    await assert.rejects(
      () => provider.send(currentOnlyRequest()),
      (error: unknown) =>
        error instanceof ProviderError &&
        error.kind === "rate_limit" &&
        error.retryAfterMs === 2_000,
    );
  });
});

test("normalizes malformed JSON and malformed schema", async () => {
  await withServer(async (request, response) => {
    await readBody(request);
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end("{broken");
  }, async (baseUrl) => {
    await assert.rejects(
      () => providerFor(baseUrl).send(currentOnlyRequest()),
      (error: unknown) =>
        error instanceof ProviderError && error.kind === "invalid_response",
    );
  });

  await withServer(async (request, response) => {
    await readBody(request);
    json(response, 200, { id: "missing-choices" });
  }, async (baseUrl) => {
    await assert.rejects(
      () => providerFor(baseUrl).send(currentOnlyRequest()),
      (error: unknown) =>
        error instanceof ProviderError && error.kind === "invalid_response",
    );
  });
});

test("distinguishes provider timeout from user cancellation", async () => {
  await withServer(async (request, response) => {
    await readBody(request);
    await delay(100);
    json(response, 200, successPayload());
  }, async (baseUrl) => {
    const provider = new OpenAICompatibleProvider({
      kind: "openai-compatible",
      baseUrl,
      model: "fixture-model",
      timeoutMs: 20,
    });

    await assert.rejects(
      () => provider.send(currentOnlyRequest()),
      (error: unknown) =>
        error instanceof ProviderError && error.kind === "timeout",
    );
  });

  await withServer(async (request, response) => {
    await readBody(request);
    await delay(100);
    json(response, 200, successPayload());
  }, async (baseUrl) => {
    const provider = providerFor(baseUrl);
    const controller = new AbortController();
    const pending = provider.send(currentOnlyRequest(controller.signal));
    setTimeout(() => controller.abort(), 10);

    await assert.rejects(
      pending,
      (error: unknown) =>
        error instanceof DOMException && error.name === "AbortError",
    );
  });
});

test("normalizes fetch failure as network error", async () => {
  const provider = new OpenAICompatibleProvider(
    {
      kind: "openai-compatible",
      baseUrl: "http://127.0.0.1:1/v1",
      model: "fixture-model",
      timeoutMs: 1_000,
    },
    async () => {
      throw new TypeError("offline");
    },
  );

  await assert.rejects(
    () => provider.send(currentOnlyRequest()),
    (error: unknown) =>
      error instanceof ProviderError && error.kind === "network",
  );
});

function providerFor(baseUrl: string): OpenAICompatibleProvider {
  return new OpenAICompatibleProvider({
    kind: "openai-compatible",
    baseUrl,
    model: "fixture-model",
    timeoutMs: 1_000,
  });
}

function requestWithHistory() {
  const sessionId = "session-1";
  const messages: ChatMessage[] = [
    message(sessionId, 1, "user", "first", "complete"),
    message(sessionId, 2, "assistant", "answer", "complete"),
    message(sessionId, 3, "user", "failed old", "failed"),
    message(sessionId, 4, "user", "interrupted old", "interrupted"),
    message(sessionId, 5, "user", "current", "pending"),
  ];

  return {
    requestId: "request-1",
    sessionId,
    model: "fixture-model",
    messages,
  };
}

function currentOnlyRequest(signal?: AbortSignal) {
  const sessionId = "session-1";
  return {
    requestId: "request-1",
    sessionId,
    model: "fixture-model",
    messages: [
      message(sessionId, 1, "user", "current", "pending"),
    ],
    signal,
  };
}

function message(
  sessionId: string,
  sequence: number,
  role: "user" | "assistant",
  text: string,
  status: "pending" | "complete" | "interrupted" | "failed",
): ChatMessage {
  return createMessage({
    sessionId,
    sequence,
    role,
    text,
    status,
  });
}

function successPayload() {
  return {
    id: "chatcmpl-ok",
    choices: [
      {
        message: { role: "assistant", content: "ok" },
        finish_reason: "stop",
      },
    ],
  };
}

async function withServer(
  handler: (request: IncomingMessage, response: ServerResponse) => Promise<void>,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handler(request, response).catch((error) => {
      response.statusCode = 500;
      response.end(error instanceof Error ? error.message : "fixture error");
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${address.port}/v1`);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function readBody(request: IncomingMessage): Promise<string> {
  let body = "";
  request.setEncoding("utf8");
  for await (const chunk of request) {
    body += chunk;
  }
  return body;
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
