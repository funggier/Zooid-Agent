import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ChatService } from "../chat/chat-service.ts";
import type { OpenAICompatibleProviderSettings } from "../config/provider-settings.ts";
import { createProviderRuntime } from "../providers/provider-runtime.ts";
import { FileSessionStore } from "../storage/file-session-store.ts";

export interface LiveQualificationOptions {
  dataRoot?: string;
  keepData?: boolean;
  marker?: string;
}

export interface LiveQualificationResult {
  outcome: "PASS" | "FAIL";
  provider: "openai-compatible";
  model: string;
  baseUrl: string;
  marker: string;
  sessionId: string;
  messageCount: number;
  orderedCompleteTranscript: boolean;
  markerRecovered: boolean;
  firstResponseLength: number;
  secondResponseLength: number;
  dataRoot: string | null;
}

export async function runLiveProviderQualification(
  settings: OpenAICompatibleProviderSettings,
  options: LiveQualificationOptions = {},
): Promise<LiveQualificationResult> {
  const marker = options.marker ?? `ZOOID-${randomUUID()}`;
  const managedTempRoot = options.dataRoot === undefined;
  const root = managedTempRoot
    ? await mkdtemp(join(tmpdir(), "zooid-live-qualification-"))
    : resolve(options.dataRoot);
  const keepData = options.keepData ?? !managedTempRoot;

  try {
    const runtime = createProviderRuntime(settings);
    const store = new FileSessionStore(root);
    const chat = new ChatService({
      provider: runtime.provider,
      store,
      model: runtime.model,
    });
    const session = await chat.createSession();

    const first = await chat.sendText(
      session.id,
      `Qualification turn 1. Remember this exact marker for the next turn: ${marker}. Reply briefly to confirm you will remember it.`,
    );

    const second = await chat.sendText(
      session.id,
      "Qualification turn 2. Return the exact marker from the previous turn. Include the marker verbatim in your reply.",
    );

    const persisted = await store.load(session.id);
    const orderedCompleteTranscript =
      persisted.messages.length === 4 &&
      persisted.messages.every(
        (message, index) =>
          message.sequence === index + 1 && message.status === "complete",
      ) &&
      persisted.messages[0]?.role === "user" &&
      persisted.messages[1]?.role === "assistant" &&
      persisted.messages[2]?.role === "user" &&
      persisted.messages[3]?.role === "assistant";

    const markerRecovered = second.text.includes(marker);
    const outcome =
      orderedCompleteTranscript && markerRecovered ? "PASS" : "FAIL";

    return {
      outcome,
      provider: "openai-compatible",
      model: settings.model,
      baseUrl: settings.baseUrl,
      marker,
      sessionId: session.id,
      messageCount: persisted.messages.length,
      orderedCompleteTranscript,
      markerRecovered,
      firstResponseLength: first.text.length,
      secondResponseLength: second.text.length,
      dataRoot: keepData ? root : null,
    };
  } finally {
    if (managedTempRoot && !keepData) {
      await rm(root, { recursive: true, force: true });
    }
  }
}
