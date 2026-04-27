import { Injectable } from '@nestjs/common';
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
type AppVersionSummary = { id: string; name: string; createdAt: Date };
type AppWithVersions = { id: string; name: string; slug: string; versions: AppVersionSummary[] };
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
  // appVersionId removed: app_version_id dropped from data_source_versions
  createdAt: Date;
};
type DataSourceSummary = {
  id: string;
  name: string;
  kind: string;
  pluginId: string;
  scope: string;
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

  private async fetchApps(organizationId: string): Promise<AppWithVersions[]> {
    const rows: Array<{
      appId: string;
      appName: string;
      appSlug: string;
      versionId: string | null;
      versionName: string | null;
      versionCreatedAt: Date | null;
    }> = await this.appsRepository
      .createQueryBuilder('app')
      .leftJoin('app_versions', 'version', 'version.app_id = app.id')
      .where('app.organization_id = :organizationId', { organizationId })
      .select([
        'app.id AS "appId"',
        'app.name AS "appName"',
        'app.slug AS "appSlug"',
        'version.id AS "versionId"',
        'version.name AS "versionName"',
        'version.created_at AS "versionCreatedAt"',
      ])
      .orderBy('app.created_at', 'ASC')
      .addOrderBy('version.created_at', 'ASC')
      .getRawMany();

    const byApp = new Map<string, AppWithVersions>();

    for (const row of rows) {
      if (!byApp.has(row.appId)) {
        byApp.set(row.appId, { id: row.appId, name: row.appName, slug: row.appSlug, versions: [] });
      }
      if (row.versionId) {
        byApp.get(row.appId).versions.push({
          id: row.versionId,
          name: row.versionName,
          createdAt: row.versionCreatedAt,
        });
      }
    }

    return [...byApp.values()];
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
      select: ['id', 'name', 'kind', 'pluginId', 'scope'],
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
        // appVersionId removed: app_version_id dropped from data_source_versions
        createdAt: v.createdAt,
      });
      versionsByDs.set(v.dataSourceId, list);
    }

    return dataSources.map(({ id, name, kind, pluginId, scope }) => ({
      id,
      name,
      kind,
      pluginId,
      scope,
      versions: versionsByDs.get(id) ?? [],
    }));
  }
}
