import { ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { App } from 'src/entities/app.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class PublicAppEnvironmentGuard extends AuthGuard('jwt') {
  constructor(protected readonly _dataSource: DataSource) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<any> {
    const request = context.switchToHttp().getRequest();

    const slug = request.query.slug;
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
    const qb = this._dataSource
      .createQueryBuilder()
      .select(['app.id AS app_id', 'app.organization_id AS app_organization_id', 'av.is_public AS av_is_public'])
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

    const result = await qb.getRawOne();

    let app;
    let isPublic: boolean;

    if (result) {
      app = await this._dataSource.manager.findOne(App, { where: { id: result.app_id } });
      isPublic = result.av_is_public;
    } else {
      // Fallback for workflows (slug on apps table)
      app = await this._dataSource.manager.findOne(App, { where: { slug } });
      isPublic = app?.isPublic;
    }

    if (!app) throw new NotFoundException('App not found. Invalid app id');

    request.tj_app = app;
    request.tj_resource_id = app.id;
    request.headers['tj-workspace-id'] = app.organizationId;

    if (isPublic === true) {
      return true;
    }

    return super.canActivate(context);
  }
}
