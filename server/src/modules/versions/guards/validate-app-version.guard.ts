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
import { AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
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

    // Workflows keep is_public on apps.*; non-workflows carry it on the branch-specific
    // app_version. Look up the version itself; if VERSION-type, fall back to the default
    // branch's BRANCH-type version (the canonical metadata carrier). Non-git-sync
    // workspaces have no default branch — the fallback returns null and the original
    // VERSION-type row is used (it carries isPublic).
    if (app.type !== APP_TYPES.WORKFLOW) {
      let version = await this.versionRepository.findOne({
        where: { id: versionId },
        select: ['id', 'versionType', 'isPublic'],
      });
      if (version && version.versionType !== AppVersionType.BRANCH) {
        const defaultBranch = await this.versionRepository.manager.findOne(WorkspaceBranch, {
          where: { organizationId: app.organizationId, isDefault: true },
          select: ['id'],
        });
        if (defaultBranch) {
          const fallback = await this.versionRepository.findOne({
            where: {
              appId: app.id,
              branchId: defaultBranch.id,
              versionType: AppVersionType.BRANCH,
            },
            select: ['id', 'isPublic'],
          });
          if (fallback) version = fallback;
        }
      }
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
