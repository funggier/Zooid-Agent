import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

test("CLI exposes and persists the selected route through routed ChatService", async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), "zooid-cli-route-"));

  try {
    const result = await runCli(dataRoot, [
      "/route",
      "/route fake fake-echo",
      "hello routed cli",
      "/exit",
    ]);

    assert.equal(
      result.code,
      0,
      `stderr:\n${result.stderr}\nstdout:\n${result.stdout}`,
    );
    assert.match(result.stdout, /Current route: fake\/fake-echo/);
    assert.match(
      result.stdout,
      /Selected route for next request: fake\/fake-echo/,
    );
    assert.match(result.stdout, /zooid> Echo: hello routed cli/);

    const sessionId =
      result.stdout.match(/Session: ([A-Za-z0-9_-]+)/)?.[1];
    assert.ok(sessionId, "CLI did not print a session ID");

    const raw = await readFile(
      join(dataRoot, "sessions", `${sessionId}.json`),
      "utf8",
    );
    const persisted = JSON.parse(raw) as {
      messages: Array<{
        role: string;
        route?: {
          providerId?: string;
          model?: string;
          routeId?: string;
          adapterRevision?: string;
        };
        providerResponseId?: string;
      }>;
    };

    assert.equal(persisted.messages.length, 2);
    assert.deepEqual(
      persisted.messages.map((message) => message.route?.providerId),
      ["fake", "fake"],
    );
    assert.deepEqual(
      persisted.messages.map((message) => message.route?.model),
      ["fake-echo", "fake-echo"],
    );
    assert.match(
      persisted.messages[0]?.route?.routeId ?? "",
      /^route-[0-9a-f]{24}$/,
    );
    assert.equal(
      persisted.messages[0]?.route?.adapterRevision,
      "fake-r1",
    );
    assert.equal(
      typeof persisted.messages[1]?.providerResponseId,
      "string",
    );
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
  }
});

test("invalid CLI route selection is rejected immediately and leaves the prior route active", async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), "zooid-cli-route-invalid-"));

  try {
    const result = await runCli(dataRoot, [
      "/route missing model-x",
      "/route",
      "still works",
      "/exit",
    ]);

    assert.equal(
      result.code,
      0,
      `stderr:\n${result.stderr}\nstdout:\n${result.stdout}`,
    );
    assert.match(
      result.stdout,
      /zooid> route error: Provider "missing" is not registered\./,
    );
    assert.match(result.stdout, /Current route: fake\/fake-echo/);
    assert.match(result.stdout, /zooid> Echo: still works/);
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
  }
});

function runCli(
  dataRoot: string,
  commands: readonly string[],
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/cli/chat.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ZOOID_DATA_DIR: dataRoot,
        ZOOID_PROVIDER: "fake",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let sent = false;
    const readyMarker =
      "Commands: /new, /open <session-id>, /exit";
    const finalReply = "zooid> Echo: ";
    const timeout = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `CLI route smoke timed out. stdout:\n${stdout}\nstderr:\n${stderr}`,
        ),
      );
    }, 5_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;

      if (!sent && stdout.includes(readyMarker)) {
        sent = true;
        child.stdin.end(`${commands.join("\n")}\n`);
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
