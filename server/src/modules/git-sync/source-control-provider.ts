import { Injectable } from '@nestjs/common';

/**
 * Minimal contract every git provider adapter self-declares so the registry can key on it.
 * Adapters implement the rest of their provider behaviour on top of this.
 */
export interface RegisteredGitProvider {
  readonly gitType: string;
}

/**
 * Registry base for git provider adapters (both the git-sync/config layer and the app-git layer
 * extend this). Concrete dispatchers register their adapters ONCE — from a multi-injection token —
 * and resolve by `gitType`. A new provider (e.g. Bitbucket) therefore plugs in through module
 * wiring alone: no edits to this base, to existing provider adapters, or to the dispatchers.
 *
 * Generic over the concrete adapter type so callers keep full method typing on the resolved provider.
 */
@Injectable()
export class SourceControlProviderService<TProvider extends RegisteredGitProvider = RegisteredGitProvider> {
  private readonly providerRegistry = new Map<string, TProvider>();

  /** Register adapters keyed by their self-declared gitType. Later registrations win per key. */
  protected registerProviders(providers: readonly TProvider[]): void {
    for (const provider of providers ?? []) {
      if (provider?.gitType) this.providerRegistry.set(provider.gitType, provider);
    }
  }

  /** Resolve the adapter for a gitType, or null when unknown/absent. */
  protected resolveProvider(gitType?: string | null): TProvider | null {
    return (gitType && this.providerRegistry.get(gitType)) || null;
  }

  /** All registered adapters, in registration order (for "first configured provider" scans). */
  protected get registeredProviders(): TProvider[] {
    return Array.from(this.providerRegistry.values());
  }
}
