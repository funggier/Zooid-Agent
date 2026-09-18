import { randomUUID } from "node:crypto";
import {
  createMessage,
  nextSequence,
  type ChatMessage,
  type ChatSession,
  type MessageRoute,
} from "../domain/messages.ts";
import type {
  ChatProvider,
  ChatRequest,
  ProviderRequirements,
} from "../providers/contracts.ts";
import type {
  RouteDecision,
  RouteSelection,
} from "../providers/router.ts";
import { ProviderRouter } from "../providers/router.ts";
import { FileSessionStore } from "../storage/file-session-store.ts";

const BASE_TEXT_REQUIREMENTS: ProviderRequirements = {
  roles: ["user", "assistant"],
  contentTypes: ["text"],
};

export class ChatInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatInputError";
  }
}

export class RouteRejectedError extends Error {
  readonly decision: RouteDecision;

  constructor(decision: RouteDecision) {
    super(`Route rejected: ${decision.reason}`);
    this.name = "RouteRejectedError";
    this.decision = decision;
  }
}

interface LegacyChatServiceInput {
  provider: ChatProvider;
  store: FileSessionStore;
  model?: string;
  router?: never;
  route?: never;
}

interface RoutedChatServiceInput {
  router: ProviderRouter;
  store: FileSessionStore;
  route: RouteSelection;
  provider?: never;
  model?: never;
}

type ChatServiceInput = LegacyChatServiceInput | RoutedChatServiceInput;

interface SelectedRoute {
  providerId: string;
  model: string;
  requiredCapabilities: ProviderRequirements;
}

interface DispatchSnapshot {
  provider: ChatProvider;
  model: string;
  route?: MessageRoute;
}

export class ChatService {
  private readonly store: FileSessionStore;
  private readonly provider?: ChatProvider;
  private readonly model?: string;
  private readonly router?: ProviderRouter;
  private selectedRoute?: SelectedRoute;

  constructor(input: ChatServiceInput) {
    this.store = input.store;

    if ("router" in input && input.router) {
      this.router = input.router;
      this.selectedRoute = normalizeRouteSelection(input.route);
      return;
    }

    this.provider = input.provider;
    this.model = input.model ?? "fake-echo";
  }

  createSession(): Promise<ChatSession> {
    return this.store.create();
  }

  openSession(sessionId: string): Promise<ChatSession> {
    return this.store.load(sessionId);
  }

  selectRoute(route: RouteSelection): void {
    if (!this.router) {
      throw new ChatInputError("Provider routing is not configured.");
    }

    this.selectedRoute = normalizeRouteSelection(route);
  }

  getSelectedRoute(): SelectedRoute | undefined {
    return this.selectedRoute
      ? cloneSelectedRoute(this.selectedRoute)
      : undefined;
  }

  async sendText(
    sessionId: string,
    text: string,
    signal?: AbortSignal,
  ): Promise<ChatMessage> {
    if (text.trim().length === 0) {
      throw new ChatInputError("Message cannot be empty.");
    }

    const requestId = randomUUID();
    const routeSelection = this.selectedRoute
      ? cloneSelectedRoute(this.selectedRoute)
      : undefined;
    const session = await this.store.load(sessionId);
    const dispatch = this.resolveDispatch(
      requestId,
      sessionId,
      routeSelection,
    );

    const userMessage = createMessage({
      sessionId,
      sequence: nextSequence(session),
      role: "user",
      text,
      status: "pending",
      route: dispatch.route,
    });
    session.messages.push(userMessage);
    await this.store.save(session);

    const request: ChatRequest = {
      requestId,
      sessionId,
      model: dispatch.model,
      messages: session.messages.map(cloneMessage),
      signal,
    };

    try {
      const result = await dispatch.provider.send(request);
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
        route: dispatch.route,
        providerResponseId: result.responseId,
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

  private resolveDispatch(
    requestId: string,
    sessionId: string,
    routeSelection?: SelectedRoute,
  ): DispatchSnapshot {
    if (this.router) {
      if (!routeSelection) {
        throw new ChatInputError("No provider route is selected.");
      }

      const resolution = this.router.resolve({
        requestId,
        sessionId,
        selectedProvider: routeSelection.providerId,
        model: routeSelection.model,
        requiredCapabilities: routeSelection.requiredCapabilities,
      });

      if (!resolution.accepted) {
        throw new RouteRejectedError(resolution.decision);
      }

      return {
        provider: resolution.provider,
        model: resolution.decision.model,
        route: routeFromDecision(resolution.decision),
      };
    }

    if (!this.provider || !this.model) {
      throw new ChatInputError("No provider is configured.");
    }

    return {
      provider: this.provider,
      model: this.model,
    };
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function normalizeRouteSelection(route: RouteSelection): SelectedRoute {
  const required = route.requiredCapabilities ?? {};
  return {
    providerId: route.providerId,
    model: route.model,
    requiredCapabilities: {
      roles: unique([
        ...(BASE_TEXT_REQUIREMENTS.roles ?? []),
        ...(required.roles ?? []),
      ]),
      contentTypes: unique([
        ...(BASE_TEXT_REQUIREMENTS.contentTypes ?? []),
        ...(required.contentTypes ?? []),
      ]),
      ...(required.streaming !== undefined
        ? { streaming: required.streaming }
        : {}),
      ...(required.usage !== undefined
        ? { usage: required.usage }
        : {}),
      ...(required.minimumContextLimit !== undefined
        ? { minimumContextLimit: required.minimumContextLimit }
        : {}),
    },
  };
}

function cloneSelectedRoute(route: SelectedRoute): SelectedRoute {
  return {
    providerId: route.providerId,
    model: route.model,
    requiredCapabilities: {
      ...(route.requiredCapabilities.roles
        ? { roles: [...route.requiredCapabilities.roles] }
        : {}),
      ...(route.requiredCapabilities.contentTypes
        ? { contentTypes: [...route.requiredCapabilities.contentTypes] }
        : {}),
      ...(route.requiredCapabilities.streaming !== undefined
        ? { streaming: route.requiredCapabilities.streaming }
        : {}),
      ...(route.requiredCapabilities.usage !== undefined
        ? { usage: route.requiredCapabilities.usage }
        : {}),
      ...(route.requiredCapabilities.minimumContextLimit !== undefined
        ? {
            minimumContextLimit:
              route.requiredCapabilities.minimumContextLimit,
          }
        : {}),
    },
  };
}

function routeFromDecision(decision: RouteDecision): MessageRoute {
  return {
    routeId: decision.routeId,
    requestId: decision.requestId,
    providerId: decision.providerId,
    model: decision.model,
    adapterRevision: decision.adapterRevision,
  };
}

function cloneMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    ...(message.route ? { route: { ...message.route } } : {}),
  };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
