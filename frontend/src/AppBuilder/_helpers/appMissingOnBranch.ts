interface AppLoadResult {
  editing_version?: unknown;
}

interface LoadContext {
  mode: string;
  moduleMode: boolean;
  isPreviewForVersion: boolean;
}

// The server answers 200 with no editing_version when the app has no version on the requested
// feature branch; the editor cannot render that, so the caller must leave the page.
export function isAppMissingOnBranch(result: AppLoadResult, ctx: LoadContext): boolean {
  return ctx.mode === 'edit' && !ctx.moduleMode && !ctx.isPreviewForVersion && !result.editing_version;
}

// Same exit the branch switcher takes for an app that is absent on the target branch.
export function redirectAppMissingOnBranch(
  workspaceId: string,
  appName: string | undefined,
  replace: (url: string) => void = (url) => window.location.replace(url)
): void {
  sessionStorage.setItem('git_sync_toast', `${appName || 'This app'} does not exist on this branch`);
  replace(`/${workspaceId}`);
}
