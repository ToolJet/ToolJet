/**
 * Service registry for PlatformGitPullService.
 *
 * Avoids circular dependency: AppsModule → ImportExportResourcesModule → AppsModule.
 * The EE PlatformGitPullService registers itself on init; AppsService reads it here.
 */

import { BadRequestException } from '@nestjs/common';

/**
 * Error thrown by hydrateStubApp. `gitPhase` marks failures that happened while talking
 * to GitHub (auth or a remote git command). Those messages can echo the authenticated
 * clone URL — which embeds the installation token — so callers MUST NOT forward the raw
 * message to clients; surface a generic 'GitHub error' instead. When false, the failure
 * is local import/DB work and the (token-free) message is safe to forward.
 *
 * Extends BadRequestException so existing callers keep the 400 HTTP semantics they had
 * when hydrateStubApp threw a plain BadRequestException.
 */
export class HydrationError extends BadRequestException {
  constructor(
    message: string,
    readonly gitPhase: boolean
  ) {
    super(message);
  }
}

/**
 * Strip embedded credentials (e.g. `https://x-access-token:<token>@host/...`) from a
 * message before returning it to a client. Defense-in-depth for the local-phase path in
 * case a URL carrying a token ever leaks into a non-git error.
 */
export function scrubGitCredentials(message: string): string {
  return (message ?? '').replace(/(\bhttps?:\/\/)[^/@\s]+@/gi, '$1');
}

export interface IPlatformGitPullService {
  hydrateStubApp(stubApp: any, user: any, branchId?: string, tagSha?: string, tagName?: string): Promise<any>;
  /**
   * Last path segment of an `appPath` like `apps/folder/my-app` → `my-app`, or
   * `modules/my-module` → `my-module`. Used by callers that need to resolve a
   * module/app name from moduleMeta/appMeta entries.
   */
  extractAppNameFromPath(appPath: string): string;
  /**
   * Given a parent app already materialised for a branch, look up every
   * ModuleViewer component's moduleAppId.value and hydrate any module that
   * still has a stub version on that branch. Use after workspace-level pulls
   * where the parent app itself was not re-hydrated (so the parent's normal
   * cascade in hydrateStubApp did not run).
   */
  hydrateStaleReferencedModules(parentApp: any, user: any, branchId: string): Promise<void>;
  /**
   * Create stub module rows + branch-specific AppVersion rows for every module
   * listed in the repo's `.meta/moduleMeta.json`. Used by the single-app git
   * import flow so ModuleViewer components in the imported app have valid
   * co_relation_id targets in this workspace.
   *
   * `coRelationIdFilter` (optional): only process meta entries whose keys are in
   * this set. Used by single-app imports to avoid pulling unrelated modules.
   */
  pullModules(
    user: any,
    repoPath: string,
    organizationId: string,
    branchId: string,
    force?: boolean,
    coRelationIdFilter?: Set<string>
  ): Promise<{
    imported: number;
    skipped: number;
    stale: number;
    outdated: number;
    errors?: number;
    firstErrorMessage?: string | null;
  }>;
}

let _pullService: IPlatformGitPullService | null = null;

export function registerPlatformGitPullService(service: IPlatformGitPullService): void {
  _pullService = service;
}

export function getPlatformGitPullService(): IPlatformGitPullService | null {
  return _pullService;
}
