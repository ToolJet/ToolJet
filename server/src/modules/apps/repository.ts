import { App } from '@entities/app.entity';
import { AppVersion, AppVersionType } from '@entities/app_version.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SessionAppData } from './types';
import { WorkspaceAppsResponseDto } from '@modules/external-apis/dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { isUUID } from 'class-validator';

@Injectable()
export class AppsRepository extends Repository<App> {
  constructor(private dataSource: DataSource) {
    super(App, dataSource.createEntityManager());
  }

  async findBySlug(slug: string, organizationId: string, versionId?: string, branchId?: string): Promise<App> {
    if (branchId) {
      // Resolve slug through app_versions for branch context
      const version = await this.dataSource.getRepository(AppVersion).findOne({
        where: { slug, branchId },
        relations: ['app'],
      });
      if (version?.app && version.app.organizationId === organizationId) {
        return version.app;
      }
      return null;
    }

    // No branch context: resolve through any version carrying this slug
    // (BRANCH-type for git-sync workspaces, VERSION-type for non-git-sync)
    const version = await this.dataSource.getRepository(AppVersion).findOne({
      where: { slug },
      relations: ['app'],
    });
    if (version?.app && version.app.organizationId === organizationId) {
      return version.app;
    }

    // Fallback to apps table slug (for workflows or legacy)
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where: {
        ...versionCondition,
        slug,
        organizationId,
      },
    });
  }

  async retrieveAppDataUsingSlug(slug: string): Promise<SessionAppData> {
    // Resolve through any version carrying this slug
    const version = await this.dataSource.getRepository(AppVersion).findOne({
      where: { slug },
      relations: ['app'],
    });

    if (version?.app) {
      return {
        organizationId: version.app.organizationId,
        isPublic: version.isPublic,
        isReleased: version.app.currentVersionId ? true : false,
      };
    }

    // Fallback to apps table (for workflows)
    let app: App;
    try {
      app = await this.findOneOrFail({ where: { slug } });
    } catch (error) {
      app = await this.findOne({ where: { slug } });
    }

    return {
      organizationId: app?.organizationId,
      isPublic: app?.isPublic,
      isReleased: app?.currentVersionId ? true : false,
    };
  }

  async findByAppName(name: string, organizationId: string, versionId?: string): Promise<App> {
    // Check app_versions for non-workflow app names
    // (BRANCH-type for git-sync workspaces, VERSION-type for non-git-sync)
    const version = await this.dataSource.getRepository(AppVersion)
      .createQueryBuilder('av')
      .innerJoinAndSelect('av.app', 'app')
      .where('av.app_name = :name', { name })
      .andWhere('app.organization_id = :organizationId', { organizationId })
      .getOne();
    if (version?.app) return version.app;

    // Fallback to apps table (for workflows)
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where: { name, organizationId, ...versionCondition },
    });
  }

  findOneById(id: string): Promise<App> {
    return this.findOne({ where: { id } });
  }

  findById(id: string, organizationId: string, versionId?: string): Promise<App> {
    const versionCondition = versionId ? { appVersions: { id: versionId } } : {};
    const baseWhere = { id, ...versionCondition };
    const where = organizationId ? { ...baseWhere, organizationId } : baseWhere;

    return this.findOne({
      ...(versionId ? { relations: ['appVersions'] } : {}),
      where,
    });
  }

  findByDataQuery(dataQueryId: string, organizationId?: string, versionId?: string): Promise<App> {
    return this.findOne({
      relations: ['appVersions', 'appVersions.dataQueries'],
      where: {
        ...(organizationId ? { organizationId } : {}),
        appVersions: { dataQueries: { id: dataQueryId }, ...(versionId ? { id: versionId } : {}) },
      },
    });
  }

  async findAllOrganizationApps(organizationId: string, branchId?: string): Promise<WorkspaceAppsResponseDto[]> {
    const qb = this.createQueryBuilder('app')
      .select([
        'app.id AS id',
        'app.created_at AS "createdAt"',
        'app.organization_id AS "organizationId"',
        'version.id AS "versionId"',
        'version.name AS "versionName"',
        'version.created_at AS "versionCreatedAt"',
      ])
      .leftJoin('app_versions', 'version', 'version.app_id = app.id')
      .where('app.organizationId = :organizationId', { organizationId });

    if (branchId) {
      // Show version-level metadata from the BRANCH-type version for this branch
      qb.addSelect('av_meta.app_name AS name')
        .addSelect('av_meta.slug AS slug')
        .addSelect('av_meta.icon AS icon')
        .addSelect('av_meta.is_public AS "isPublic"')
        .innerJoin(
          'app_versions',
          'av_meta',
          'av_meta.app_id = app.id AND av_meta.branch_id = :branchId AND av_meta.version_type = :branchType',
          { branchId, branchType: 'branch' }
        );
    } else {
      // No branch context: resolve metadata from BRANCH-type version (git-sync workspaces)
      // or any VERSION-type version with slug set (non-git-sync workspaces),
      // falling back to apps table (workflows)
      qb.addSelect(
        `COALESCE(av_meta.app_name, app.name) AS name`
      )
        .addSelect(`COALESCE(av_meta.slug, app.slug) AS slug`)
        .addSelect(`COALESCE(av_meta.icon, app.icon) AS icon`)
        .addSelect(`COALESCE(av_meta.is_public, app.is_public) AS "isPublic"`)
        .leftJoin(
          'app_versions',
          'av_meta',
          `av_meta.app_id = app.id AND av_meta.slug IS NOT NULL AND av_meta.id = (
            SELECT av_inner.id FROM app_versions av_inner
            WHERE av_inner.app_id = app.id AND av_inner.slug IS NOT NULL
            ORDER BY CASE WHEN av_inner.version_type = 'branch' THEN 0 ELSE 1 END, av_inner.updated_at DESC
            LIMIT 1
          )`
        );
    }

    return await qb
      .orderBy('app.created_At', 'ASC')
      .addOrderBy('version.created_at', 'ASC')
      .getRawMany();
  }

  async findByAppId(appId: string, manager?: EntityManager): Promise<App> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(App, {
        where: { id: appId },
        relations: ['appVersions'],
      });
    }, manager || this.manager);
  }

  async findByIdOrSlug(idOrSlug: string): Promise<App | null> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      if (isUUID(idOrSlug)) {
        const byId = await manager.findOne(App, { where: { id: idOrSlug }, relations: ['appVersions'] });
        if (byId) return byId;
      }
      // Try resolving through any version carrying this slug
      // (BRANCH-type for git-sync workspaces, VERSION-type for non-git-sync)
      const result = await manager
        .createQueryBuilder(App, 'app')
        .innerJoin('app_versions', 'av', 'av.app_id = app.id')
        .where('av.slug = :slug', { slug: idOrSlug })
        .getOne();
      if (result) return result;

      // Fallback to apps table slug (workflows)
      return manager.findOne(App, { where: { slug: idOrSlug }, relations: ['appVersions'] });
    }, this.manager);
  }
}
