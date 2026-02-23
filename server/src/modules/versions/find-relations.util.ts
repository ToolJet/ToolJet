import { AppVersion } from '@entities/app_version.entity';
import { DataSource, EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from '@entities/app.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { Component } from '@entities/component.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { EventHandler } from '@entities/event_handler.entity';
import { Page } from '@entities/page.entity';
import { User } from '@entities/user.entity';
import { DataSourceScopes } from '@modules/data-sources/constants';

export async function findAllRelationsForVersion(versionId: string, manager?: EntityManager): Promise<any> {
  // this.getUuidFieldsForExport()
  return await dbTransactionWrap(async (manager: EntityManager) => {}, manager);
}
async function getUuidFieldsForExport(
  user: User,
  id: string,
  searchParams: any = {}
): Promise<{
  appId: string;
  versionIds: string[];
  dataSourceIds: string[];
  dataQueryIds: string[];
  dataSourceOptionIds: string[];
  pageIds: string[];
  componentIds: string[];
  layoutIds: string[];
  eventHandlerIds: string[];
  environmentIds: string[];
  permissionIds: string[];
}> {
  const versionId = searchParams?.version_id;

  return await dbTransactionWrap(async (manager: EntityManager) => {
    // Get App ID only
    const app = await manager
      .createQueryBuilder(App, 'apps')
      .select('apps.id')
      .where('apps.id = :id AND apps.organization_id = :organizationId', {
        id,
        organizationId: user?.organizationId,
      })
      .getOne();

    if (!app) {
      throw new Error('App not found');
    }

    // Get App Version IDs only
    const queryAppVersions = manager
      .createQueryBuilder(AppVersion, 'app_versions')
      .select('app_versions.id')
      .where('app_versions.appId = :appId', { appId: app.id });

    if (versionId) {
      queryAppVersions.andWhere('app_versions.id = :versionId', { versionId });
    }

    const appVersions = await queryAppVersions.getMany();
    const versionIds = appVersions.map((v) => v.id);

    // Get Legacy Local Data Source IDs only
    // const legacyLocalDataSources = versionIds.length
    //   ? await manager
    //       .createQueryBuilder(DataSource, 'data_sources')
    //       .select('data_sources.id')
    //       .where('data_sources.appVersionId IN(:...versionId)', { versionId: versionIds })
    //       .andWhere('data_sources.scope != :scope', { scope: DataSourceScopes.GLOBAL })
    //       .getMany()
    //   : [];

    // Get Environment IDs only
    const appEnvironments = await manager
      .createQueryBuilder(AppEnvironment, 'app_environments')
      .select('app_environments.id')
      .where('app_environments.organizationId = :organizationId', {
        organizationId: user?.organizationId,
      })
      .getMany();

    const environmentIds = appEnvironments.map((env) => env.id);

    // Get Global Data Source IDs from queries
    const globalQueries = await manager
      .createQueryBuilder(DataQuery, 'data_query')
      .select(['data_query.dataSourceId'])
      .innerJoin('data_query.dataSource', 'dataSource')
      .where('data_query.appVersionId IN(:...versionId)', { versionId: versionIds })
      .andWhere('dataSource.scope = :scope', { scope: DataSourceScopes.GLOBAL })
      .getMany();

    const globalDataSourceIds = [...new Set(globalQueries.map((gq) => gq.dataSourceId))];

    // Combine all data source IDs
    // const allDataSourceIds = [...legacyLocalDataSources.map((ds) => ds.id), ...globalDataSourceIds];
    const allDataSourceIds = [...globalDataSourceIds];

    // Get Data Query IDs only
    const dataQueries = allDataSourceIds.length
      ? await manager
          .createQueryBuilder(DataQuery, 'data_queries')
          .select('data_queries.id')
          .where('data_queries.dataSourceId IN(:...dataSourceId)', {
            dataSourceId: allDataSourceIds,
          })
          .andWhere('data_queries.appVersionId IN(:...versionId)', { versionId: versionIds })
          .getMany()
      : [];

    const dataQueryIds = dataQueries.map((dq) => dq.id);

    // Get Data Source Option IDs only
    const dataSourceOptions = allDataSourceIds.length
      ? await manager
          .createQueryBuilder(DataSourceOptions, 'data_source_options')
          .select('data_source_options.id')
          .where(
            'data_source_options.environmentId IN(:...environmentId) AND data_source_options.dataSourceId IN(:...dataSourceId)',
            {
              environmentId: environmentIds,
              dataSourceId: allDataSourceIds,
            }
          )
          .getMany()
      : [];

    const dataSourceOptionIds = dataSourceOptions.map((dso) => dso.id);

    // Get Page IDs only
    const pages = await manager
      .createQueryBuilder(Page, 'page')
      .select('page.id')
      .where('page.appVersionId IN(:...versionId)', { versionId: versionIds })
      .getMany();

    const pageIds = pages.map((p) => p.id);

    // Get Page Permission IDs
    // const pagePermissions = pageIds.length
    //   ? await manager
    //       .createQueryBuilder(Permissions, 'permission')
    //       .select('permission.id')
    //       .where('permission.pageId IN(:...pageId)', { pageId: pageIds })
    //       .getMany()
    //   : [];

    // Get Component IDs and Layout IDs
    const components = pageIds.length
      ? await manager
          .createQueryBuilder(Component, 'components')
          .select(['components.id'])
          .leftJoin('components.layouts', 'layouts')
          .addSelect('layouts.id')
          .where('components.pageId IN(:...pageId)', { pageId: pageIds })
          .getMany()
      : [];

    const componentIds = components.map((c) => c.id);
    const layoutIds = components.flatMap((c) => c.layouts?.map((l) => l.id) || []);

    // Get Component Permission IDs
    // const componentPermissions = componentIds.length
    //   ? await manager
    //       .createQueryBuilder(Permissions, 'permission')
    //       .select('permission.id')
    //       .where('permission.componentId IN(:...componentId)', { componentId: componentIds })
    //       .getMany()
    //   : [];

    // // Get Data Query Permission IDs
    // const queryPermissions = dataQueryIds.length
    //   ? await manager
    //       .createQueryBuilder(Permissions, 'permission')
    //       .select('permission.id')
    //       .where('permission.dataQueryId IN(:...dataQueryId)', { dataQueryId: dataQueryIds })
    //       .getMany()
    //   : [];

    // Get Event Handler IDs only
    const events = await manager
      .createQueryBuilder(EventHandler, 'event_handlers')
      .select('event_handlers.id')
      .where('event_handlers.appVersionId IN(:...versionId)', { versionId: versionIds })
      .getMany();

    const eventHandlerIds = events.map((e) => e.id);

    // Combine all permission IDs
    // const allPermissionIds = [
    //   ...pagePermissions.map((p) => p.id),
    //   ...componentPermissions.map((p) => p.id),
    //   ...queryPermissions.map((p) => p.id),
    // ];

    return {
      appId: app.id,
      versionIds,
      dataSourceIds: allDataSourceIds,
      dataQueryIds,
      dataSourceOptionIds,
      pageIds,
      componentIds,
      layoutIds,
      eventHandlerIds,
      environmentIds,
      //   permissionIds: allPermissionIds,
    };
  });
}
