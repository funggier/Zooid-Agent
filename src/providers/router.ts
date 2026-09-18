import { createHash } from "node:crypto";
import type {
  ChatProvider,
  ProviderCompatibilityResult,
  ProviderRequirements,
} from "./contracts.ts";
import {
  ProviderRegistry,
  evaluateProviderCompatibility,
} from "./registry.ts";

export interface RouteSelection {
  providerId: string;
  model: string;
  requiredCapabilities?: ProviderRequirements;
}

export interface RouteRequest {
  requestId: string;
  sessionId: string;
  selectedProvider: string;
  model: string;
  requiredCapabilities: ProviderRequirements;
}

export interface RouteDecision {
  routeId: string;
  requestId: string;
  sessionId: string;
  providerId: string;
  model: string;
  adapterRevision: string;
  compatibilityResult: ProviderCompatibilityResult;
  reason: string;
}

export interface AcceptedRouteResolution {
  accepted: true;
  decision: RouteDecision;
  provider: ChatProvider;
}

export interface RejectedRouteResolution {
  accepted: false;
  decision: RouteDecision;
}

export type RouteResolution =
  | AcceptedRouteResolution
  | RejectedRouteResolution;

export class ProviderRouter {
  private readonly registry: ProviderRegistry;

  constructor(registry: ProviderRegistry) {
    this.registry = registry;
  }

  resolve(request: RouteRequest): RouteResolution {
    assertRouteIdentity(request.requestId, "requestId");
    assertRouteIdentity(request.sessionId, "sessionId");

    const registration = this.registry.resolve(
      request.selectedProvider,
      request.model,
    );

    const compatibilityResult = evaluateProviderCompatibility(
      registration.descriptor,
      request.requiredCapabilities,
    );

    const decision: RouteDecision = {
      routeId: createRouteId(request, registration.descriptor.adapterRevision),
      requestId: request.requestId,
      sessionId: request.sessionId,
      providerId: registration.descriptor.providerId,
      model: request.model,
      adapterRevision: registration.descriptor.adapterRevision,
      compatibilityResult,
      reason: compatibilityResult.compatible
        ? "explicit_selection"
        : `missing_capabilities:${compatibilityResult.missing.join(",")}`,
    };

    if (!compatibilityResult.compatible) {
      return {
        accepted: false,
        decision,
      };
    }

    return {
      accepted: true,
      decision,
      provider: registration.provider,
    };
  }
}

function createRouteId(
  request: RouteRequest,
  adapterRevision: string,
): string {
  const canonical = JSON.stringify({
    requestId: request.requestId,
    sessionId: request.sessionId,
    providerId: request.selectedProvider,
    model: request.model,
    adapterRevision,
    requiredCapabilities: canonicalRequirements(request.requiredCapabilities),
  });

  const digest = createHash("sha256")
    .update(canonical)
    .digest("hex")
    .slice(0, 24);

  return `route-${digest}`;
}

function canonicalRequirements(
  requirements: ProviderRequirements,
): ProviderRequirements {
  return {
    roles: requirements.roles
      ? [...requirements.roles].sort()
      : undefined,
    contentTypes: requirements.contentTypes
      ? [...requirements.contentTypes].sort()
      : undefined,
    streaming: requirements.streaming,
    usage: requirements.usage,
    minimumContextLimit: requirements.minimumContextLimit,
  };
}

function assertRouteIdentity(value: string, field: string): void {
  if (value.length === 0 || value !== value.trim()) {
    throw new TypeError(
      `${field} must be non-empty and already trimmed.`,
    );
  }
}
