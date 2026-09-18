import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("CLI reaches an OpenAI-compatible HTTP endpoint without leaking API key", async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), "zooid-provider-cli-"));
  const secret = "fixture-secret-value";
  let observedAuthorization: string | undefined;
  let observedModel: string | undefined;

  const server = createServer(async (request, response) => {
    observedAuthorization = request.headers.authorization;

    let body = "";
    request.setEncoding("utf8");
    for await (const chunk of request) {
      body += chunk;
    }

    const parsed = JSON.parse(body) as { model?: string };
    observedModel = parsed.model;

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        id: "chatcmpl-cli",
        choices: [
          {
            message: { role: "assistant", content: "real adapter fixture reply" },
            finish_reason: "stop",
          },
        ],
      }),
    );
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address() as AddressInfo;

  try {
    const result = await runCliConversation({
      dataRoot,
      baseUrl: `http://127.0.0.1:${address.port}/v1`,
      secret,
    });

    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Provider: openai-compatible/);
    assert.match(result.stdout, /zooid> real adapter fixture reply/);
    assert.equal(result.stdout.includes(secret), false);
    assert.equal(result.stderr.includes(secret), false);
    assert.equal(observedAuthorization, `Bearer ${secret}`);
    assert.equal(observedModel, "fixture-model");
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(dataRoot, { recursive: true, force: true });
  }
});

function runCliConversation(input: {
  dataRoot: string;
  baseUrl: string;
  secret: string;
}): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/cli/chat.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ZOOID_DATA_DIR: input.dataRoot,
        ZOOID_PROVIDER: "openai-compatible",
        ZOOID_PROVIDER_BASE_URL: input.baseUrl,
        ZOOID_PROVIDER_MODEL: "fixture-model",
        ZOOID_PROVIDER_API_KEY: input.secret,
        ZOOID_PROVIDER_TIMEOUT_MS: "1000",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let sentMessage = false;
    let sentExit = false;
    const ready = "Commands: /new, /open <session-id>, /exit";
    const reply = "zooid> real adapter fixture reply";

    const timeout = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `CLI provider smoke timed out. stdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    }, 5_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;

      if (!sentMessage && stdout.includes(ready)) {
        sentMessage = true;
        child.stdin.write("hello compatible endpoint\n");
      }

      if (sentMessage && !sentExit && stdout.includes(reply)) {
        sentExit = true;
        child.stdin.end("/exit\n");
      }
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.once("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}
