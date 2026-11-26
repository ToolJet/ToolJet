import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
    const { appId, versionId, organizationId } = request.params;
    const user: User = request.user;
    // user.branchId (resolved in the JWT strategy) so metadata overlay reflects the caller's active branch.
    const branchId = user?.branchId || undefined;
    if (!appId && !versionId) {
      throw new BadRequestException('App ID or version ID must be provided');
    }

    // Tenant isolation: refuse a route :organizationId that is not the caller's workspace.
    if (organizationId && organizationId !== user.organizationId) {
      throw new ForbiddenException('App not found. Invalid App id');
    }

    let app: App;
    if (appId) {
      app =
        request.tj_app ||
        (appId && (await this.appRepository.findById(appId, user.organizationId, undefined, branchId)));
    } else if (versionId) {
      // Forward user.branchId so getAppVersionById overlays the right branch's metadata
      // onto `version.app` (otherwise it'd default to default-branch / any version).
      const version = await this.versionRepository.getAppVersionById(versionId, branchId);
      app = version?.app;
    }
    if (!app) {
      throw new NotFoundException('App not found. Invalid App id');
    }

    // Tenant isolation: the :versionId path loads by id with no workspace filter.
    if (app.organizationId !== user.organizationId) {
      throw new NotFoundException('App not found. Invalid App id');
    }

    // Attach the found app to the request
    request.tj_app = app;
    request.tj_resource_id = app.id;
    return true;
  }
}
