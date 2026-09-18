import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { runLiveProviderQualification } from "../src/qualification/live-provider-qualification.ts";

test("live qualification proves two-turn history through the compatible transport", async () => {
  const observedBodies: Array<{
    model: string;
    messages: Array<{ role: string; content: string }>;
  }> = [];

  await withServer(async (request, response) => {
    const body = JSON.parse(await readBody(request)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    observedBodies.push(body);

    if (observedBodies.length === 1) {
      json(response, {
        id: "chatcmpl-turn-1",
        choices: [
          {
            message: { role: "assistant", content: "ACK" },
            finish_reason: "stop",
          },
        ],
      });
      return;
    }

    const firstUser = body.messages[0]?.content ?? "";
    const marker = firstUser.match(/ZOOID-[0-9a-f-]+/i)?.[0];
    assert.ok(marker, "fixture could not recover marker from prior history");

    json(response, {
      id: "chatcmpl-turn-2",
      choices: [
        {
          message: { role: "assistant", content: `Recovered: ${marker}` },
          finish_reason: "stop",
        },
      ],
    });
  }, async (baseUrl) => {
    const result = await runLiveProviderQualification({
      kind: "openai-compatible",
      baseUrl,
      model: "fixture-model",
      timeoutMs: 1_000,
    });

    assert.equal(result.outcome, "PASS");
    assert.equal(result.markerRecovered, true);
    assert.equal(result.orderedCompleteTranscript, true);
    assert.equal(result.messageCount, 4);
    assert.equal(result.dataRoot, null);
    assert.equal(observedBodies.length, 2);
    assert.equal(observedBodies[0]?.messages.length, 1);
    assert.equal(observedBodies[1]?.messages.length, 3);
    assert.deepEqual(
      observedBodies[1]?.messages.map((message) => message.role),
      ["user", "assistant", "user"],
    );
  });
});

test("live qualification fails when turn two cannot recover the marker", async () => {
  await withServer(async (request, response) => {
    await readBody(request);
    json(response, {
      id: "chatcmpl-no-memory",
      choices: [
        {
          message: { role: "assistant", content: "I do not know." },
          finish_reason: "stop",
        },
      ],
    });
  }, async (baseUrl) => {
    const result = await runLiveProviderQualification(
      {
        kind: "openai-compatible",
        baseUrl,
        model: "fixture-model",
        timeoutMs: 1_000,
      },
      { marker: "ZOOID-fixed-marker" },
    );

    assert.equal(result.outcome, "FAIL");
    assert.equal(result.markerRecovered, false);
    assert.equal(result.orderedCompleteTranscript, true);
  });
});

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

function json(response: ServerResponse, body: unknown): void {
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
