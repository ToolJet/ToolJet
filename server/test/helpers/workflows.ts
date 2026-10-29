/**
 * Workflow test helpers -- factories for workflow data sources and queries.
 * The rest of the workflow helpers need EE code and live in the ee test tree.
 */
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { AppVersion } from '@entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSourceVersionOptions } from '@entities/data_source_version_options.entity';
import { getDefaultDataSource } from './setup';

// ---------------------------------------------------------------------------
// Workflow data source & query factories
// ---------------------------------------------------------------------------

/** Creates a DataSource for a workflow (global scope, with DataSourceOptions). */
export const createWorkflowDataSource = async (
  nestApp: INestApplication,
  organizationId: string,
  appVersionId: string,
  kind: string,
  environmentId: string,
  options: {
    name?: string;
    type?: 'static' | 'default' | 'sample';
    scope?: 'global' | 'local';
    pluginId?: string;
  } = {}
): Promise<DataSource> => {
  const ds = getDefaultDataSource();
  const dataSourceRepository = ds.getRepository(DataSource);

  const dataSource = dataSourceRepository.create({
    id: randomUUID(),
    name: options.name || (options.type === 'static' ? `${kind}default` : kind),
    kind: kind,
    type: options.type || 'default',
    scope: options.scope || 'global',
    pluginId: options.pluginId || null,
    appVersionId: (options.scope || 'global') === 'global' ? null : appVersionId,
    organizationId: organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const savedDataSource = await dataSourceRepository.save(dataSource);

  // DataSourceOptions/data_source_options was dropped (migration DropDataSourceOptionsTable);
  // options now live on a DataSourceVersion (one per data source per branch) via
  // DataSourceVersionOptions, keyed by (dataSourceVersionId, environmentId).
  const workspaceBranchRepository = ds.getRepository(WorkspaceBranch);
  let defaultBranch = await workspaceBranchRepository.findOne({
    where: { organizationId, isDefault: true },
  });
  if (!defaultBranch) {
    defaultBranch = await workspaceBranchRepository.save(
      workspaceBranchRepository.create({ organizationId, name: 'main', isDefault: true })
    );
  }

  const dataSourceVersionRepository = ds.getRepository(DataSourceVersion);
  const dataSourceVersion = await dataSourceVersionRepository.save(
    dataSourceVersionRepository.create({
      dataSourceId: savedDataSource.id,
      branchId: defaultBranch.id,
      name: savedDataSource.name,
      isActive: true,
    })
  );

  const dataSourceVersionOptionsRepository = ds.getRepository(DataSourceVersionOptions);
  const dataSourceVersionOptions = dataSourceVersionOptionsRepository.create({
    dataSourceVersionId: dataSourceVersion.id,
    environmentId: environmentId,
    options: {},
  });
  await dataSourceVersionOptionsRepository.save(dataSourceVersionOptions);

  return savedDataSource;
};

/** Creates a DataQuery attached to a workflow data source. */
export const createWorkflowDataQuery = async (
  nestApp: INestApplication,
  appVersion: AppVersion,
  dataSource: DataSource,
  queryConfig: {
    name: string;
    options: Record<string, any>;
  }
): Promise<DataQuery> => {
  const ds = getDefaultDataSource();
  const dataQueryRepository = ds.getRepository(DataQuery);

  const dataQuery = dataQueryRepository.create({
    id: randomUUID(),
    name: queryConfig.name,
    options: queryConfig.options,
    dataSourceId: dataSource.id,
    appVersionId: appVersion.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return await dataQueryRepository.save(dataQuery);
};
