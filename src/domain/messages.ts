import { randomUUID } from "node:crypto";

export type MessageRole = "user" | "assistant";
export type MessageStatus = "pending" | "complete" | "interrupted" | "failed";

export interface MessageRoute {
  routeId: string;
  requestId: string;
  providerId: string;
  model: string;
  adapterRevision: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sequence: number;
  role: MessageRole;
  text: string;
  status: MessageStatus;
  createdAt: string;
  route?: MessageRoute;
  providerResponseId?: string;
}

export interface ChatSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export function createSession(now = new Date()): ChatSession {
  const timestamp = now.toISOString();
  return {
    id: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
  };
}

export function createMessage(input: {
  sessionId: string;
  sequence: number;
  role: MessageRole;
  text: string;
  status?: MessageStatus;
  now?: Date;
  route?: MessageRoute;
  providerResponseId?: string;
}): ChatMessage {
  return {
    id: randomUUID(),
    sessionId: input.sessionId,
    sequence: input.sequence,
    role: input.role,
    text: input.text,
    status: input.status ?? "pending",
    createdAt: (input.now ?? new Date()).toISOString(),
    ...(input.route ? { route: { ...input.route } } : {}),
    ...(input.providerResponseId
      ? { providerResponseId: input.providerResponseId }
      : {}),
  };
}

export function nextSequence(session: ChatSession): number {
  const last = session.messages.at(-1);
  return last ? last.sequence + 1 : 1;
}
