import { stderr, stdout } from "node:process";
import {
  loadProviderSettings,
  ProviderConfigError,
} from "../config/provider-settings.ts";
import { ProviderError } from "../providers/contracts.ts";
import { runLiveProviderQualification } from "../qualification/live-provider-qualification.ts";

try {
  const settings = loadProviderSettings();

  if (settings.kind !== "openai-compatible") {
    throw new ProviderConfigError(
      "ZOOID_PROVIDER",
      "Live qualification requires ZOOID_PROVIDER=openai-compatible.",
    );
  }

  const keepData = process.env.ZOOID_QUALIFY_KEEP_DATA === "1";
  const dataRoot = process.env.ZOOID_QUALIFY_DATA_DIR?.trim() || undefined;
  const result = await runLiveProviderQualification(settings, {
    keepData,
    dataRoot,
  });

  stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.outcome === "PASS" ? 0 : 3;
} catch (error) {
  if (error instanceof ProviderConfigError) {
    stderr.write(
      `${JSON.stringify({
        outcome: "BLOCKED",
        kind: "configuration",
        key: error.key,
        message: error.message,
      })}\n`,
    );
    process.exitCode = 2;
  } else if (error instanceof ProviderError) {
    stderr.write(
      `${JSON.stringify({
        outcome: "FAIL",
        kind: error.kind,
        message: error.safeMessage,
        retryAfterMs: error.retryAfterMs,
      })}\n`,
    );
    process.exitCode = 4;
  } else if (error instanceof Error) {
    stderr.write(
      `${JSON.stringify({
        outcome: "FAIL",
        kind: "unexpected",
        message: error.message,
      })}\n`,
    );
    process.exitCode = 1;
  } else {
    stderr.write(
      `${JSON.stringify({
        outcome: "FAIL",
        kind: "unexpected",
        message: "Unknown qualification error.",
      })}\n`,
    );
    process.exitCode = 1;
  }
}
