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
import { TransactionLogger } from '@modules/logging/service';
import { AppVersion } from '@entities/app_version.entity';
import { APP_TYPES } from '@modules/apps/constants';

@Injectable()
export class ValidateQueryAppGuard implements CanActivate {
  constructor(
    private readonly versionRepository: VersionRepository,
    private readonly appsRepository: AppsRepository,
    private readonly transactionLogger: TransactionLogger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    try {
      const request = context.switchToHttp().getRequest();
      const { id, versionId } = request.params;
      const appId = request.body?.app_id;
      const user: User = request.user;

      if (!id && !versionId && !appId) {
        throw new BadRequestException();
      }

      // User is mandatory
      if (!user) {
        throw new ForbiddenException();
      }
      let app;
      if (id) {
        app = await this.appsRepository.findByDataQuery(id, user?.organizationId, versionId);
      }
      if (!app && appId) {
        app = await this.appsRepository.findById(appId, user?.organizationId, versionId);
      }
      if (!app && versionId) {
        app = await this.versionRepository.findAppFromVersion(versionId, user?.organizationId);
      }

      // If app is not found, throw NotFoundException
      if (!app) {
        throw new NotFoundException('App not found');
      }

      // Workflows keep is_public on apps.*; non-workflows carry it on the branch-specific
      // app_version. Resolve the version via the most-specific identifier we have and
      // overlay so downstream ability checks (e.g. RUN_VIEWER on public apps) see the
      // correct flag. BRANCH-type versions are the canonical metadata carrier; if the
      // resolved version is VERSION-type, fall back to the default branch's BRANCH-type
      // version. Non-git-sync workspaces have no default branch — the fallback returns
      // null and the original VERSION-type row is used (it carries isPublic).
      if (app.type !== APP_TYPES.WORKFLOW) {
        let version: AppVersion | null = null;
        if (versionId) {
          version = await this.versionRepository.findOne({
            where: { id: versionId },
            select: ['id', 'versionType', 'isPublic'],
          });
        } else if (id) {
          version = await this.versionRepository
            .createQueryBuilder('av')
            .innerJoin('av.dataQueries', 'dq', 'dq.id = :dqId', { dqId: id })
            .select(['av.id', 'av.versionType', 'av.isPublic'])
            .getOne();
        } else if (appId) {
          version = await this.versionRepository.findOne({
            where: { appId },
            order: { updatedAt: 'DESC' },
            select: ['id', 'versionType', 'isPublic'],
          });
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
    } finally {
      // Any cleanup logic if needed
      this.transactionLogger.log(
        `ValidateQueryAppGuard completed at ${new Date().toISOString()} after ${Date.now() - startTime}ms`
      );
    }
  }
}
