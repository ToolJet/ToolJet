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
    if (!appId && !versionId) {
      throw new BadRequestException('App ID or version ID must be provided');
    }

    let app: App;
    if (appId) {
      app = request.tj_app || (appId && (await this.appRepository.findById(appId, user.organizationId)));
    } else if (versionId) {
      const version = await this.versionRepository.getAppVersionById(versionId);
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
