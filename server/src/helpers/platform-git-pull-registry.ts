/**
 * Service registry for PlatformGitPullService.
 *
 * Avoids circular dependency: AppsModule → ImportExportResourcesModule → AppsModule.
 * The EE PlatformGitPullService registers itself on init; AppsService reads it here.
 */

export interface IPlatformGitPullService {
  hydrateStubApp(stubApp: any, user: any): Promise<any>;
}

let _pullService: IPlatformGitPullService | null = null;

export function registerPlatformGitPullService(service: IPlatformGitPullService): void {
  _pullService = service;
}

export function getPlatformGitPullService(): IPlatformGitPullService | null {
  return _pullService;
}
