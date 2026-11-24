interface AppLoadResult {
  name?: string | null;
  editing_version_unresolved?: boolean;
  hydration_status?: string;
  hydration_error?: { message?: string };
}

interface LoadContext {
  mode: string;
  moduleMode: boolean;
  isPreviewForVersion: boolean;
}

// The server marks a load with editing_version_unresolved when the branch has no version for the
// app (absent on the branch, or a stub that failed to hydrate). The editor cannot render that.
export function isAppMissingOnBranch(result: AppLoadResult, ctx: LoadContext): boolean {
  return ctx.mode === 'edit' && !ctx.moduleMode && !ctx.isPreviewForVersion && !!result.editing_version_unresolved;
}

// Same exit the branch switcher takes for an app that is absent on the target branch.
export function redirectAppMissingOnBranch(
  workspaceId: string,
  result: AppLoadResult,
  replace: (url: string) => void = (url) => window.location.replace(url)
): void {
  const name = result.name || 'This app';
  const message =
    result.hydration_status === 'failed'
      ? `Couldn't load ${result.name || 'this app'} from git: ${result.hydration_error?.message || 'unknown error'}`
      : `${name} does not exist on this branch`;
  sessionStorage.setItem('git_sync_toast', message);
  replace(`/${workspaceId}`);
}
