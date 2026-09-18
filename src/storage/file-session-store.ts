import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  createSession,
  type ChatMessage,
  type ChatSession,
  type MessageRoute,
} from "../domain/messages.ts";

export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = "SessionNotFoundError";
  }
}

export class SessionCorruptError extends Error {
  readonly filePath: string;

  constructor(filePath: string, cause?: unknown) {
    super(
      `Session file is corrupt and was preserved: ${filePath}`,
      cause === undefined ? undefined : { cause },
    );
    this.name = "SessionCorruptError";
    this.filePath = filePath;
  }
}

export class FileSessionStore {
  readonly root: string;
  readonly sessionsDir: string;

  constructor(root = process.env.ZOOID_DATA_DIR ?? ".zooid-data") {
    this.root = resolve(root);
    this.sessionsDir = join(this.root, "sessions");
  }

  async create(): Promise<ChatSession> {
    const session = createSession();
    await this.save(session);
    return session;
  }

  async load(sessionId: string): Promise<ChatSession> {
    validateSessionId(sessionId);
    const filePath = this.pathFor(sessionId);
    let raw: string;

    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        throw new SessionNotFoundError(sessionId);
      }
      throw error;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      assertSession(parsed, sessionId);
      return parsed;
    } catch (error) {
      if (error instanceof SessionCorruptError) {
        throw error;
      }
      throw new SessionCorruptError(filePath, error);
    }
  }

  async save(session: ChatSession): Promise<void> {
    validateSessionId(session.id);
    assertSession(session, session.id);
    await mkdir(this.sessionsDir, { recursive: true });

    const filePath = this.pathFor(session.id);
    const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    const persisted: ChatSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      messages: session.messages.map(cloneMessage),
    };

    await writeFile(
      tempPath,
      `${JSON.stringify(persisted, null, 2)}\n`,
      "utf8",
    );
    await rename(tempPath, filePath);
    session.updatedAt = persisted.updatedAt;
  }

  pathFor(sessionId: string): string {
    validateSessionId(sessionId);
    return join(this.sessionsDir, `${sessionId}.json`);
  }
}

function validateSessionId(sessionId: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(sessionId)) {
    throw new Error("Invalid session ID.");
  }
}

function assertSession(
  value: unknown,
  expectedId: string,
): asserts value is ChatSession {
  if (!value || typeof value !== "object") {
    throw new Error("Session must be an object.");
  }

  const session = value as Partial<ChatSession>;
  if (
    session.id !== expectedId ||
    typeof session.createdAt !== "string" ||
    typeof session.updatedAt !== "string"
  ) {
    throw new Error("Session metadata is invalid.");
  }

  if (!Array.isArray(session.messages)) {
    throw new Error("Session messages must be an array.");
  }

  let expectedSequence = 1;
  for (const message of session.messages) {
    if (!message || typeof message !== "object") {
      throw new Error("Session message is invalid.");
    }

    if (
      message.sessionId !== expectedId ||
      message.sequence !== expectedSequence ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.text !== "string" ||
      !["pending", "complete", "interrupted", "failed"].includes(
        message.status,
      )
    ) {
      throw new Error("Session message contract is invalid.");
    }

    if (message.route !== undefined) {
      assertRoute(message.route);
    }

    if (
      message.providerResponseId !== undefined &&
      (message.role !== "assistant" ||
        typeof message.providerResponseId !== "string" ||
        message.providerResponseId.length === 0)
    ) {
      throw new Error("Session provider response attribution is invalid.");
    }

    expectedSequence += 1;
  }
}

function assertRoute(value: unknown): asserts value is MessageRoute {
  if (!value || typeof value !== "object") {
    throw new Error("Session message route is invalid.");
  }

  const route = value as Partial<MessageRoute>;
  for (const field of [
    route.routeId,
    route.requestId,
    route.providerId,
    route.model,
    route.adapterRevision,
  ]) {
    if (typeof field !== "string" || field.length === 0) {
      throw new Error("Session message route is invalid.");
    }
  }
}

function cloneMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    ...(message.route ? { route: { ...message.route } } : {}),
  };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
