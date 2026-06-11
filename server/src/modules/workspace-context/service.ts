import { Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { User as UserEntity } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { AppsRepository } from '@modules/apps/repository';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { OrganizationRepository } from '@modules/organizations/repository';
import { DataSourceScopes } from '@modules/data-sources/constants';
import { WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { RESOURCE } from './constants';

type OrganizationSummary = { id: string; name: string; slug: string };
type ComponentSummary = { id: string; name: string; type: string; co_relation_id: string | null; pageId: string };
type AppSummary = { id: string; name: string; slug: string; co_relation_id: string | null };
type AppVersionSummary = { id: string; name: string; createdAt: Date; co_relation_id: string | null };
type AppVersionWithComponents = AppVersionSummary & { components: ComponentSummary[] };
type AppDetail = { id: string; name: string; slug: string; co_relation_id: string | null; versions: AppVersionWithComponents[] };
type QueryGroup = {
  appId: string;
  appName: string;
  queries: { id: string; name: string; versionId: string; dataSourceId: string; kind: string }[];
};
type DataSourceVersionSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  branchId: string | null;
  createdAt: Date;
};
type DataSourceSummary = {
  id: string;
  name: string;
  kind: string;
  pluginId: string;
  scope: string;
  co_relation_id: string | null;
  versions: DataSourceVersionSummary[];
};

@Injectable()
export class WorkspaceContextService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly appsRepository: AppsRepository,
    private readonly dataQueryRepository: DataQueryRepository,
    private readonly dataSourcesRepository: DataSourcesRepository
  ) {}

  async fetch(resource: RESOURCE, user: UserEntity) {
    switch (resource) {
      case RESOURCE.ORGANIZATIONS:
        return this.fetchOrganizations(user);
      case RESOURCE.APPS:
        return this.fetchApps(user.organizationId);
      case RESOURCE.QUERIES:
        return this.fetchQueriesGroupedByApp(user.organizationId);
      case RESOURCE.DATASOURCES:
        return this.fetchGlobalDataSources(user.organizationId);
    }
  }

  private async fetchOrganizations(user: UserEntity): Promise<OrganizationSummary[]> {
    const organizations = await this.organizationRepository.manager.find(Organization, {
      where: {
        status: WORKSPACE_STATUS.ACTIVE,
        organizationUsers: {
          userId: user.id,
          status: WORKSPACE_USER_STATUS.ACTIVE,
        },
      },
      select: ['id', 'name', 'slug'],
      order: { name: 'ASC' },
    });

    return organizations.map(({ id, name, slug }) => ({ id, name, slug }));
  }

  private async fetchApps(organizationId: string): Promise<AppSummary[]> {
    const rows: Array<{ appId: string; appName: string; appSlug: string; appCoRelationId: string | null }> =
      await this.appsRepository
        .createQueryBuilder('app')
        .where('app.organization_id = :organizationId', { organizationId })
        .select([
          'app.id AS "appId"',
          'app.name AS "appName"',
          'app.slug AS "appSlug"',
          'app.co_relation_id AS "appCoRelationId"',
        ])
        .orderBy('app.created_at', 'ASC')
        .getRawMany();

    return rows.map((r) => ({ id: r.appId, name: r.appName, slug: r.appSlug, co_relation_id: r.appCoRelationId ?? null }));
  }

  async fetchAppById(appId: string, organizationId: string): Promise<AppDetail> {
    const rows: Array<{
      appId: string;
      appName: string;
      appSlug: string;
      appCoRelationId: string | null;
      versionId: string | null;
      versionName: string | null;
      versionCreatedAt: Date | null;
      versionCoRelationId: string | null;
    }> = await this.appsRepository
      .createQueryBuilder('app')
      .leftJoin('app_versions', 'version', 'version.app_id = app.id')
      .where('app.id = :appId', { appId })
      .andWhere('app.organization_id = :organizationId', { organizationId })
      .select([
        'app.id AS "appId"',
        'app.name AS "appName"',
        'app.slug AS "appSlug"',
        'app.co_relation_id AS "appCoRelationId"',
        'version.id AS "versionId"',
        'version.name AS "versionName"',
        'version.created_at AS "versionCreatedAt"',
        'version.co_relation_id AS "versionCoRelationId"',
      ])
      .orderBy('version.created_at', 'ASC')
      .getRawMany();

    if (rows.length === 0) throw new NotFoundException(`App ${appId} not found in this workspace`);

    const first = rows[0];
    const app: AppDetail = {
      id: first.appId,
      name: first.appName,
      slug: first.appSlug,
      co_relation_id: first.appCoRelationId ?? null,
      versions: [],
    };

    const versionMap = new Map<string, AppVersionWithComponents>();
    for (const row of rows) {
      if (row.versionId && !versionMap.has(row.versionId)) {
        const v: AppVersionWithComponents = {
          id: row.versionId,
          name: row.versionName,
          createdAt: row.versionCreatedAt,
          co_relation_id: row.versionCoRelationId ?? null,
          components: [],
        };
        versionMap.set(row.versionId, v);
        app.versions.push(v);
      }
    }

    if (versionMap.size > 0) {
      const versionIds = [...versionMap.keys()];
      const compRows: Array<{
        componentId: string;
        componentName: string;
        componentType: string;
        componentCoRelationId: string | null;
        componentPageId: string;
        versionId: string;
      }> = await this.appsRepository.manager
        .createQueryBuilder()
        .select([
          'c.id AS "componentId"',
          'c.name AS "componentName"',
          'c.type AS "componentType"',
          'c.co_relation_id AS "componentCoRelationId"',
          'c.page_id AS "componentPageId"',
          'p.app_version_id AS "versionId"',
        ])
        .from('components', 'c')
        .innerJoin('pages', 'p', 'p.id = c.page_id')
        .where('p.app_version_id IN (:...versionIds)', { versionIds })
        .getRawMany();

      for (const row of compRows) {
        versionMap.get(row.versionId)?.components.push({
          id: row.componentId,
          name: row.componentName,
          type: row.componentType,
          co_relation_id: row.componentCoRelationId ?? null,
          pageId: row.componentPageId,
        });
      }
    }

    return app;
  }

  private async fetchQueriesGroupedByApp(organizationId: string): Promise<QueryGroup[]> {
    const rows: Array<{
      appId: string;
      appName: string;
      queryId: string;
      queryName: string;
      versionId: string;
      dataSourceId: string;
      kind: string;
    }> = await this.dataQueryRepository
      .createQueryBuilder('dq')
      .innerJoin('dq.appVersion', 'v')
      .innerJoin('v.app', 'a')
      .leftJoin('dq.dataSource', 'ds')
      .where('a.organization_id = :organizationId', { organizationId })
      .select([
        'a.id AS "appId"',
        'a.name AS "appName"',
        'dq.id AS "queryId"',
        'dq.name AS "queryName"',
        'v.id AS "versionId"',
        'dq.data_source_id AS "dataSourceId"',
        'ds.kind AS "kind"',
      ])
      .orderBy('a.name', 'ASC')
      .addOrderBy('dq.name', 'ASC')
      .getRawMany();

    const byApp = new Map<string, QueryGroup>();

    for (const row of rows) {
      if (!byApp.has(row.appId)) {
        byApp.set(row.appId, { appId: row.appId, appName: row.appName, queries: [] });
      }
      byApp.get(row.appId).queries.push({
        id: row.queryId,
        name: row.queryName,
        versionId: row.versionId,
        dataSourceId: row.dataSourceId,
        kind: row.kind,
      });
    }

    return [...byApp.values()];
  }

  private async fetchGlobalDataSources(organizationId: string): Promise<DataSourceSummary[]> {
    const dataSources = await this.dataSourcesRepository.find({
      where: { organizationId, scope: DataSourceScopes.GLOBAL },
      select: ['id', 'name', 'kind', 'pluginId', 'scope', 'co_relation_id'],
      order: { name: 'ASC' },
    });

    if (dataSources.length === 0) return [];

    const versions = await this.dataSourcesRepository.manager.find(DataSourceVersion, {
      where: { dataSourceId: In(dataSources.map((ds) => ds.id)) },
      select: ['id', 'name', 'isDefault', 'isActive', 'branchId', 'createdAt', 'dataSourceId'],
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });

    const versionsByDs = new Map<string, DataSourceVersionSummary[]>();
    for (const v of versions) {
      const list = versionsByDs.get(v.dataSourceId) ?? [];
      list.push({
        id: v.id,
        name: v.name,
        isDefault: v.isDefault,
        isActive: v.isActive,
        branchId: v.branchId ?? null,
        createdAt: v.createdAt,
      });
      versionsByDs.set(v.dataSourceId, list);
    }

    return dataSources.map(({ id, name, kind, pluginId, scope, co_relation_id }) => ({
      id,
      name,
      kind,
      pluginId,
      scope,
      co_relation_id: co_relation_id ?? null,
      versions: versionsByDs.get(id) ?? [],
    }));
  }
}
