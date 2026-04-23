/**
 * Service registry for PlatformGitPullService.
 *
 * Avoids circular dependency: AppsModule → ImportExportResourcesModule → AppsModule.
 * The EE PlatformGitPullService registers itself on init; AppsService reads it here.
 */

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
  ): Promise<{ imported: number; skipped: number; stale: number }>;
}

let _pullService: IPlatformGitPullService | null = null;

export function registerPlatformGitPullService(service: IPlatformGitPullService): void {
  _pullService = service;
}

export function getPlatformGitPullService(): IPlatformGitPullService | null {
  return _pullService;
}
