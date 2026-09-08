import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { App } from '@entities/app.entity';

// Blocks content mutations that target an app's *released* version.
//
// The editor freezes on the frontend when the version being edited is the released
// version (getShouldFreeze -> editingVersion.id === releasedVersionId). That check is
// client-only, so non-UI clients (MCP/PAT tokens, the CLI, the public API) can still
// mutate a released version. This guard enforces the same invariant at the backend
// boundary, mirroring the workflow-only check in AppsUtilService.updateWorflowVersion.
//
// Must run AFTER ValidAppGuard, which resolves and attaches request.tj_app.
@Injectable()
export class MutableAppVersionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const app: App = request.tj_app;

    // App not resolved yet (ValidAppGuard handles that case) or the app was never
    // released (currentVersionId is the released-version pointer) -> nothing to freeze.
    if (!app || !app.currentVersionId) return true;

    // Version-switch actions legitimately target the released version; preserve the
    // same escape hatch the workflow guard uses.
    if (request.body?.is_user_switched_version === true) return true;

    // The version this request will actually mutate: the one ValidAppGuard loaded
    // (filtered by the :versionId param), falling back to the route param itself.
    const editingVersionId = app.appVersions?.[0]?.id ?? request.params?.versionId;

    if (editingVersionId && editingVersionId === app.currentVersionId) {
      throw new BadRequestException('You cannot update a released version');
    }

    return true;
  }
}
