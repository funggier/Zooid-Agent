import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("CLI sends text through the fake provider and exits cleanly", async () => {
  const dataRoot = await mkdtemp(join(tmpdir(), "zooid-cli-"));

  try {
    const result = await runCli(dataRoot, "hello from cli\n/exit\n");
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Zooid — Powered by CogentNexus/);
    assert.match(result.stdout, /Provider: fake/);
    assert.match(result.stdout, /zooid> Echo: hello from cli/);
  } finally {
    await rm(dataRoot, { recursive: true, force: true });
  }
});

function runCli(dataRoot: string, stdinText: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["src/cli/chat.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, ZOOID_DATA_DIR: dataRoot },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("CLI smoke test timed out."));
    }, 5_000);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });

    child.stdin.end(stdinText);
  });
}
