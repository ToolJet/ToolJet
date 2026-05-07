import { ExecutionContext, Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppsRepository } from '@modules/apps/repository';
import { TransactionLogger } from '@modules/logging/service';
import { VersionRepository } from '@modules/versions/repository';
import { APP_TYPES } from '@modules/apps/constants';
import { AppVersionType } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

@Injectable()
export class QueryAuthGuard extends AuthGuard('jwt') {
  // This guard will allow access for unauthenticated user if the app is public
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly appRepository: AppsRepository,
    private readonly versionRepository: VersionRepository,
    private readonly transactionLogger: TransactionLogger
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const { id } = request.params;

    try {
      // Check if either id is provided, otherwise throw BadRequestException
      if (!id) {
        throw new BadRequestException();
      }

      const app = await this.appRepository.findByDataQuery(id);

      if (!app) {
        throw new BadRequestException();
      }
      const organization = await this.organizationRepository.getSingleOrganizationWithId(app?.organizationId);
      if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE) {
        throw new BadRequestException('Organization is Archived');
      }

      // Workflows keep is_public on apps.*; non-workflows carry it on the branch-specific
      // app_version. Look up the version that owns this data query and overlay so the
      // public-app gate below uses the correct flag. BRANCH-type versions are the canonical
      // metadata carrier; if the version is VERSION-type, fall back to the default branch's
      // BRANCH-type version. Non-git-sync workspaces have no default branch — the fallback
      // returns null and the original VERSION-type row is used (it carries isPublic).
      if (app.type !== APP_TYPES.WORKFLOW) {
        let version = await this.versionRepository
          .createQueryBuilder('av')
          .innerJoin('av.dataQueries', 'dq', 'dq.id = :dqId', { dqId: id })
          .select(['av.id', 'av.versionType', 'av.isPublic'])
          .getOne();
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

      request.tj_app = app;
      request.tj_resource_id = app.id;

      if (app.isPublic === true) {
        // No need to do user validation
        this.organizationRepository.touchLastAccessedAt(app.organizationId);
        return true;
      }

      // Throw a custom exception if the app is not public
      try {
        return await super.canActivate(context);
      } catch {
        throw new UnauthorizedException(
          JSON.stringify({
            message: 'Authentication is required to access this app.',
          })
        );
      }
    } finally {
      this.transactionLogger.log(`QueryAuthGuard completed at ${new Date().toISOString()} for app id ${id}`);
    }
  }
}
