import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { App } from '@entities/app.entity';

// Blocks content mutations that target an app's *released* version.
//
// The editor freezes on the frontend when the version being edited is the released
// version (getShouldFreeze -> editingVersion.id === releasedVersionId). That check is
// client-only, so non-UI clients (MCP/PAT tokens, the CLI, the public API) can still
// mutate a released version. This guard enforces the same invariant at the backend boundary.
//
// This is distinct from assertVersionEditable (git-sync-edit-guard), which freezes on version
// *status* (DRAFT vs PUBLISHED/RELEASED). Releasing an app only repoints App.currentVersionId — it
// does NOT change the version's status — so in a non-git workspace the released version stays DRAFT
// and the status check never fires. This guard closes that gap by comparing against the
// released-version pointer directly.
//
// Must run AFTER the guard that resolves request.tj_app (ValidAppGuard / ValidateQueryAppGuard /
// ValidateAppVersionGuard) and AFTER the feature-ability guard, so an unauthorized caller gets a
// 403 before this business rule ever returns 400.
@Injectable()
export class MutableAppVersionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const app: App = request.tj_app;

    // App not resolved (the upstream ValidApp guard handles that) or the app was never released
    // (currentVersionId is the released-version pointer) -> nothing to freeze.
    if (!app || !app.currentVersionId) return true;

    // The version this request mutates is the :versionId route param — every wired route carries it
    // and it IS the mutation target. app.appVersions[0] is only a fallback for the rare route that
    // resolves the app without the param; it can be unloaded or an arbitrary row depending on which
    // upstream guard hydrated the app, so the param must take precedence.
    const editingVersionId = request.params?.versionId ?? app.appVersions?.[0]?.id;

    if (editingVersionId && editingVersionId === app.currentVersionId) {
      throw new BadRequestException('You cannot update a released version');
    }

    return true;
  }
}
