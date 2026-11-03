import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { AppVersionStatus } from '@entities/app_version.entity';

// Must run after a guard that attaches request.tj_app (ValidAppGuard / ValidateQueryAppGuard).
@Injectable()
export class EditableAppVersionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { versionId } = request.params;
    const app: App = request.tj_app;

    if (!versionId || !app) return true;

    const version = app.appVersions?.find((v) => v.id === versionId);
    const isLocked =
      app.currentVersionId === versionId ||
      version?.status === AppVersionStatus.PUBLISHED ||
      version?.status === AppVersionStatus.RELEASED;

    if (isLocked) {
      throw new ForbiddenException(
        'This version is released and cannot be edited. Create a new draft version to make changes.'
      );
    }

    return true;
  }
}
