import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { AppsUtilService } from '../util.service';
import { AppsRepository } from '../repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { AppVersion } from '@entities/app_version.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';

@Injectable()
export class AppAuthGuard extends AuthGuard('jwt') {
  constructor(
    protected readonly appUtilService: AppsUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly appRepository: AppsRepository
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    const slug = request.params.slug || request.params.app_slug;
    if (!slug) {
      throw new NotFoundException('App not found. Invalid app id');
    }

    // Scope slug resolution to a specific branch. The same slug can appear on multiple
    // branches, so we must pin to one. Source of branch_id: x-branch-id header (sent by
    // authHeader() when the caller has an active branch). When absent, fall back to the
    // default branch.
    // TODO: Git disabled flow, should pick from versions id
    const branchId: string | null = (request.headers['x-branch-id'] as string) || null;

    // Resolve app through any version carrying this slug
    // (BRANCH-type for git-sync workspaces, VERSION-type for non-git-sync)
    const result = await dbTransactionWrap(async (manager: EntityManager) => {
      const qb = manager
        .createQueryBuilder()
        .select(['app.id AS app_id', 'av.is_public AS av_is_public'])
        .from('apps', 'app')
        .innerJoin('app_versions', 'av', 'av.app_id = app.id')
        .where('av.slug = :slug', { slug });

      if (branchId) {
        qb.andWhere('av.branch_id = :branchId', { branchId });
      } else {
        // No branch context — fall back to the default branch for git-sync workspaces,
        // and accept NULL branch_id rows for non-git-sync workspaces.
        // TODO: Git disabled flow, should pick from versions id
        qb.leftJoin(
          'workspace_branches',
          'wb',
          'wb.id = av.branch_id AND wb.organization_id = app.organization_id'
        ).andWhere('(av.branch_id IS NULL OR wb.is_default = true)');
      }

      return qb.getRawOne();
    });

    let app;
    let isPublic: boolean;

    if (result) {
      app = await this.appRepository.findOne({ where: { id: result.app_id } });
      isPublic = result.av_is_public;
    } else {
      // Fallback for workflows (slug on apps table)
      app = await this.appRepository.findOne({ where: { slug } });
      isPublic = app?.isPublic;
    }

    if (!app) throw new NotFoundException('App not found. Invalid app id');

    const organization = await this.organizationRepository.findOne({
      where: { id: app.organizationId },
    });
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
      throw new BadRequestException('Organization is Archived');

    request.tj_app = app;
    request.tj_resource_id = app.id;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (isPublic === true) {
      this.organizationRepository.touchLastAccessedAt(app.organizationId);
      return true;
    }

    try {
      const authResult = await super.canActivate(context);
      return authResult;
    } catch {
      let organizationSlug: string;
      if (app?.organizationId) {
        const organization = await this.appUtilService.getAppOrganizationDetails(app);
        organizationSlug = organization.slug || organization.id;
      }

      throw new UnauthorizedException(
        JSON.stringify({
          organizationId: organizationSlug,
          message: 'Authentication is required to access this app.',
        })
      );
    }
  }
}
