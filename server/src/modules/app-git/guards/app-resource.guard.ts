import { Injectable, CanActivate, ExecutionContext, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppsRepository } from '@modules/apps/repository';
import { User } from '@entities/user.entity';
import { VersionRepository } from '@modules/versions/repository';
import { App } from '@entities/app.entity';
// This Guard should be used after jwt auth guard
@Injectable()
export class AppResourceGuard implements CanActivate {
  constructor(
    protected readonly appRepository: AppsRepository,
    protected readonly versionRepository: VersionRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { appId, versionId } = request.params;
    const user: User = request.user;
    // Forward x-branch-id so metadata overlay reflects the caller's active branch.
    const branchId = (request.headers['x-branch-id'] as string) || undefined;
    if (!appId && !versionId) {
      throw new BadRequestException('App ID or version ID must be provided');
    }

    let app: App;
    if (appId) {
      app =
        request.tj_app ||
        (appId && (await this.appRepository.findById(appId, user.organizationId, undefined, branchId)));
    } else if (versionId) {
      // Forward x-branch-id so getAppVersionById overlays the right branch's metadata
      // onto `version.app` (otherwise it'd default to default-branch / any version).
      const version = await this.versionRepository.getAppVersionById(versionId, branchId);
      app = version?.app;
    }
    if (!app) {
      throw new NotFoundException('App not found. Invalid App id');
    }

    // Attach the found app to the request
    request.tj_app = app;
    request.tj_resource_id = app.id;
    return true;
  }
}
