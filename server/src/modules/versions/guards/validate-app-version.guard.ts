import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@entities/user.entity';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class ValidateAppVersionGuard implements CanActivate {
  constructor(
    private readonly versionRepository: VersionRepository,
    private readonly appsRepository: AppsRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { versionId } = request.params;
    const user: User = request.user;

    // Check if either id or versionId is provided, otherwise throw BadRequestException
    if (!versionId) {
      throw new BadRequestException();
    }

    // User is mandatory
    if (!user) {
      throw new ForbiddenException();
    }

    const app = await this.versionRepository.findAppFromVersion(versionId, user.organizationId);

    // If app is not found, throw NotFoundException
    if (!app) {
      throw new NotFoundException('App not found');
    }

    // Workflows keep is_public on apps.*; non-workflows carry it on every version row
    // (default branch uses VERSION-type, sub-branches BRANCH-type, both hold the flag).
    if (app.type !== APP_TYPES.WORKFLOW) {
      const version = await this.versionRepository.findOne({
        where: { id: versionId },
        select: ['id', 'isPublic'],
      });
      if (version) {
        app.isPublic = version.isPublic;
      }
    }

    // Attach the found app to the request
    request.tj_app = app;
    request.tj_resource_id = app.id;

    // Return true to allow the request to proceed
    return true;
  }
}
