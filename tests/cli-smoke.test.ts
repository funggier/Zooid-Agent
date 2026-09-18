import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("CLI sends text through the fake provider and exits cleanly", async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), "zooid-cli-"));

  try {
    const result = await runCliConversation(dataRoot);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Zooid — Powered by CogentNexus/);
    assert.match(result.stdout, /Provider: fake/);
    assert.match(result.stdout, /zooid> Echo: hello from cli/);
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
  }
});

function runCliConversation(dataRoot: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/cli/chat.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, ZOOID_DATA_DIR: dataRoot },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let exitSent = false;
    const responseMarker = "zooid> Echo: hello from cli";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("CLI smoke test timed out."));
    }, 5_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;

      if (!exitSent && stdout.includes(responseMarker)) {
        exitSent = true;
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

    child.stdin.write("hello from cli\n");
  });
}
