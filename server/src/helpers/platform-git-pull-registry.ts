/**
 * Service registry for PlatformGitPullService.
 *
 * Avoids circular dependency: AppsModule → ImportExportResourcesModule → AppsModule.
 * The EE PlatformGitPullService registers itself on init; AppsService reads it here.
 */

export interface IPlatformGitPullService {
  hydrateStubApp(stubApp: any, user: any, branchId?: string): Promise<any>;
  /**
   * Given a parent app already materialised for a branch, look up every
   * ModuleViewer component's moduleAppId.value and hydrate any module that
   * still has a stub version on that branch. Use after workspace-level pulls
   * where the parent app itself was not re-hydrated (so the parent's normal
   * cascade in hydrateStubApp did not run).
   */
  hydrateStaleReferencedModules(parentApp: any, user: any, branchId: string): Promise<void>;
}

let _pullService: IPlatformGitPullService | null = null;

export function registerPlatformGitPullService(service: IPlatformGitPullService): void {
  _pullService = service;
}

export function getPlatformGitPullService(): IPlatformGitPullService | null {
  return _pullService;
}
