import { randomUUID } from "node:crypto";
import { createMessage, nextSequence, type ChatMessage, type ChatSession } from "../domain/messages.ts";
import type { ChatProvider, ChatRequest } from "../providers/contracts.ts";
import { FileSessionStore } from "../storage/file-session-store.ts";

export class ChatInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatInputError";
  }
}

export class ChatService {
  private readonly provider: ChatProvider;
  private readonly store: FileSessionStore;
  private readonly model: string;

  constructor(input: { provider: ChatProvider; store: FileSessionStore; model?: string }) {
    this.provider = input.provider;
    this.store = input.store;
    this.model = input.model ?? "fake-echo";
  }

  createSession(): Promise<ChatSession> {
    return this.store.create();
  }

  openSession(sessionId: string): Promise<ChatSession> {
    return this.store.load(sessionId);
  }

  async sendText(sessionId: string, text: string, signal?: AbortSignal): Promise<ChatMessage> {
    if (text.trim().length === 0) {
      throw new ChatInputError("Message cannot be empty.");
    }

    const session = await this.store.load(sessionId);
    const userMessage = createMessage({
      sessionId,
      sequence: nextSequence(session),
      role: "user",
      text,
      status: "pending",
    });
    session.messages.push(userMessage);
    await this.store.save(session);

    const request: ChatRequest = {
      requestId: randomUUID(),
      sessionId,
      model: this.model,
      messages: session.messages.map((message) => ({ ...message })),
      signal,
    };

    try {
      const result = await this.provider.send(request);
      if (signal?.aborted) {
        throw new DOMException("Provider request cancelled.", "AbortError");
      }

      userMessage.status = "complete";
      const assistantMessage = createMessage({
        sessionId,
        sequence: nextSequence(session),
        role: "assistant",
        text: result.text,
        status: "complete",
      });
      session.messages.push(assistantMessage);
      await this.store.save(session);
      return assistantMessage;
    } catch (error) {
      userMessage.status = isAbortError(error) ? "interrupted" : "failed";
      await this.store.save(session);
      throw error;
    }
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
