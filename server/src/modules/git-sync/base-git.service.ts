/**
 * Marker base for all source-control implementations. Provider-specific logic
 * lives in the concrete services; this class is intentionally empty after the
 * Phase-2 cleanup (the previous getProviderConfigs + getAppVersionById stubs
 * had no live callers).
 *
 * Kept as an `abstract` class so the provider hierarchy keeps a shared parent
 * type — future cross-provider shared behavior can land here.
 *
 * DEPENDENCY INJECTION CONSTRAINT: Only platform-common services may be
 * injected here. Provider-specific implementations stay at the concrete level.
 */
export abstract class BaseGitSyncService {
  constructor() {}
}
