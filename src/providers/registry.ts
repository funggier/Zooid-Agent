import type {
  ChatProvider,
  ProviderCompatibilityResult,
  ProviderDescriptor,
  ProviderRequirements,
} from "./contracts.ts";

export type ProviderRegistryErrorCode =
  | "invalid_descriptor"
  | "duplicate_provider"
  | "unknown_provider"
  | "unsupported_model";

export class ProviderRegistryError extends Error {
  readonly code: ProviderRegistryErrorCode;
  readonly providerId?: string;
  readonly model?: string;

  constructor(
    code: ProviderRegistryErrorCode,
    message: string,
    details: { providerId?: string; model?: string } = {},
  ) {
    super(message);
    this.name = "ProviderRegistryError";
    this.code = code;
    this.providerId = details.providerId;
    this.model = details.model;
  }
}

export interface ProviderRegistration {
  descriptor: ProviderDescriptor;
  provider: ChatProvider;
}

export class ProviderRegistry {
  private readonly registrations = new Map<string, ProviderRegistration>();

  constructor(registrations: readonly ProviderRegistration[] = []) {
    this.replaceAll(registrations);
  }

  register(registration: ProviderRegistration): void {
    validateDescriptor(registration.descriptor);

    const providerId = registration.descriptor.providerId;
    if (this.registrations.has(providerId)) {
      throw new ProviderRegistryError(
        "duplicate_provider",
        `Provider "${providerId}" is already registered.`,
        { providerId },
      );
    }

    this.registrations.set(providerId, registration);
  }

  replaceAll(registrations: readonly ProviderRegistration[]): void {
    const next = new Map<string, ProviderRegistration>();

    for (const registration of registrations) {
      validateDescriptor(registration.descriptor);
      const providerId = registration.descriptor.providerId;

      if (next.has(providerId)) {
        throw new ProviderRegistryError(
          "duplicate_provider",
          `Provider "${providerId}" is already registered.`,
          { providerId },
        );
      }

      next.set(providerId, registration);
    }

    this.registrations.clear();
    for (const [providerId, registration] of next) {
      this.registrations.set(providerId, registration);
    }
  }

  list(): ProviderRegistration[] {
    return [...this.registrations.values()];
  }

  get(providerId: string): ProviderRegistration {
    const registration = this.registrations.get(providerId);
    if (!registration) {
      throw new ProviderRegistryError(
        "unknown_provider",
        `Provider "${providerId}" is not registered.`,
        { providerId },
      );
    }

    return registration;
  }

  resolve(providerId: string, model: string): ProviderRegistration {
    const registration = this.get(providerId);
    if (!registration.descriptor.models.includes(model)) {
      throw new ProviderRegistryError(
        "unsupported_model",
        `Model "${model}" is not supported by provider "${providerId}".`,
        { providerId, model },
      );
    }

    return registration;
  }
}

export function evaluateProviderCompatibility(
  descriptor: ProviderDescriptor,
  requirements: ProviderRequirements,
): ProviderCompatibilityResult {
  const missing: string[] = [];

  for (const role of requirements.roles ?? []) {
    if (!descriptor.supportedRoles.includes(role)) {
      missing.push(`role:${role}`);
    }
  }

  for (const contentType of requirements.contentTypes ?? []) {
    if (!descriptor.contentTypes.includes(contentType)) {
      missing.push(`content:${contentType}`);
    }
  }

  if (requirements.streaming === true && !descriptor.streamingSupport) {
    missing.push("streaming");
  }

  if (requirements.usage === true && !descriptor.usageSupport) {
    missing.push("usage");
  }

  if (requirements.minimumContextLimit !== undefined) {
    if (
      descriptor.contextLimit === undefined ||
      descriptor.contextLimit < requirements.minimumContextLimit
    ) {
      missing.push(`context>=${requirements.minimumContextLimit}`);
    }
  }

  return {
    compatible: missing.length === 0,
    missing,
  };
}

function validateDescriptor(descriptor: ProviderDescriptor): void {
  assertCanonicalNonEmpty(descriptor.providerId, "providerId");
  assertCanonicalNonEmpty(descriptor.adapterRevision, "adapterRevision");

  if (descriptor.models.length === 0) {
    invalidDescriptor(
      descriptor.providerId,
      "models must contain at least one model",
    );
  }

  const modelSet = new Set<string>();
  for (const model of descriptor.models) {
    assertCanonicalNonEmpty(model, "model", descriptor.providerId);
    if (modelSet.has(model)) {
      invalidDescriptor(
        descriptor.providerId,
        `duplicate model "${model}"`,
      );
    }
    modelSet.add(model);
  }

  if (descriptor.supportedRoles.length === 0) {
    invalidDescriptor(
      descriptor.providerId,
      "supportedRoles must not be empty",
    );
  }

  if (descriptor.contentTypes.length === 0) {
    invalidDescriptor(
      descriptor.providerId,
      "contentTypes must not be empty",
    );
  }

  if (
    descriptor.contextLimit !== undefined &&
    (!Number.isSafeInteger(descriptor.contextLimit) ||
      descriptor.contextLimit <= 0)
  ) {
    invalidDescriptor(
      descriptor.providerId,
      "contextLimit must be a positive safe integer",
    );
  }
}

function assertCanonicalNonEmpty(
  value: string,
  field: string,
  providerId?: string,
): void {
  if (value.length === 0 || value !== value.trim()) {
    invalidDescriptor(
      providerId ?? value,
      `${field} must be non-empty and already trimmed`,
    );
  }
}

function invalidDescriptor(providerId: string, reason: string): never {
  throw new ProviderRegistryError(
    "invalid_descriptor",
    `Invalid provider descriptor: ${reason}.`,
    { providerId },
  );
}
