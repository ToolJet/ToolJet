import { DataSource } from '@entities/data_source.entity';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource as typeOrmDS, EntityManager, Repository, In } from 'typeorm';
import { UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataSourceScopes, DataSourceTypes } from './constants';
import { GetQueryVariables } from './types';
import { decode } from 'js-base64';

@Injectable()
export class DataSourcesRepository extends Repository<DataSource> {
  constructor(private dataSource: typeOrmDS) {
    super(DataSource, dataSource.createEntityManager());
  }

  async allGlobalDS(
    userPermissions: UserPermissions,
    organizationId: string,
    queryVars: GetQueryVariables
  ): Promise<DataSource[]> {
    const { appVersionId, environmentId } = queryVars;
    // Data source options are attached only if selectedEnvironmentId is passed
    // Returns global data sources + sample data sources
    // If version Id is passed, then data queries under each are also returned
    const dataSourcePermissions = userPermissions[MODULES.GLOBAL_DATA_SOURCE];
    const isAllUsableConfigurable = dataSourcePermissions.isAllConfigurable || dataSourcePermissions.isAllUsable;
    const canPerformCreateOrDelete = userPermissions.dataSourceCreate || userPermissions.dataSourceDelete;
    const isSuperAdmin = userPermissions.isSuperAdmin;
    const isAdmin = userPermissions.isSuperAdmin;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const query = manager
        .createQueryBuilder(DataSource, 'data_source')
        .leftJoinAndSelect('data_source.plugin', 'plugin')
        .leftJoinAndSelect('plugin.iconFile', 'iconFile')
        .leftJoinAndSelect('plugin.manifestFile', 'manifestFile')
        .leftJoinAndSelect('plugin.operationsFile', 'operationsFile');

      if (environmentId) {
        query.innerJoinAndSelect('data_source.dataSourceOptions', 'data_source_options');
      }

      query.where('data_source.type != :sampleType', { sampleType: DataSourceTypes.SAMPLE });

      if ((!isSuperAdmin || !isAdmin) && !isAllUsableConfigurable) {
        if (!canPerformCreateOrDelete) {
          query.andWhere(
            new Brackets((qb) => {
              qb.where('data_source.id IN (:...dsIds)', {
                dsIds: [
                  null,
                  ...dataSourcePermissions.usableDataSourcesId,
                  ...dataSourcePermissions.configurableDataSourceId,
                ],
              });
              if (appVersionId) {
                query.leftJoin('data_source.dataQueries', 'data_queries');
                qb.orWhere('data_queries.app_version_id = :appVersionId', { appVersionId });
              }
            })
          );
        }
      }

      query
        .andWhere('data_source.organization_id = :organizationId', { organizationId })
        .andWhere('data_source.scope = :scope', { scope: DataSourceScopes.GLOBAL });

      if (environmentId) {
        query.andWhere('data_source_options.environmentId = :environmentId', { environmentId });
      }
      const result = await query.getMany();
      result.forEach((dataSource) => {
        if (dataSource.plugin) {
          if (dataSource.plugin.iconFile) {
            dataSource.plugin.iconFile.data = dataSource.plugin.iconFile.data.toString('utf8');
          }
          if (dataSource.plugin.manifestFile) {
            dataSource.plugin.manifestFile.data = JSON.parse(
              decode(dataSource.plugin.manifestFile.data.toString('utf8'))
            );
          }
          if (dataSource.plugin.operationsFile) {
            dataSource.plugin.operationsFile.data = JSON.parse(
              decode(dataSource.plugin.operationsFile.data.toString('utf8'))
            );
          }
        }
      });

      const sampleDataSourceQuery = await manager
        .createQueryBuilder(DataSource, 'data_source')
        .where('data_source.organizationId = :organizationId', { organizationId })
        .andWhere('data_source.type = :type', { type: DataSourceTypes.SAMPLE });

      const sampleDataSource: DataSource[] = (await sampleDataSourceQuery.getMany()) || [];

      const dataSourceList = [...result, ...sampleDataSource];

      //remove tokenData from restapi datasources
      const dataSources = dataSourceList?.map((ds) => {
        if (ds.kind === 'restapi') {
          const options = {};
          Object.keys(ds.dataSourceOptions?.[0]?.options || {}).filter((key) => {
            if (key !== 'tokenData') {
              return (options[key] = ds.dataSourceOptions[0].options[key]);
            }
          });
          ds.options = options;
        } else {
          ds.options = { ...(ds.dataSourceOptions?.[0]?.options || {}) };
        }
        delete ds['dataSourceOptions'];
        return ds;
      });

      return dataSources;
    });
  }

  async findById(dataSourceId: string, manager?: EntityManager): Promise<DataSource> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(DataSource, {
        where: { id: dataSourceId },
        relations: ['plugin', 'apps', 'dataSourceOptions'],
      });
    }, manager || this.manager);
  }

  async convertToGlobalSource(dataSourceId: string, organizationId: string, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.save(DataSource, {
        id: dataSourceId,
        updatedAt: new Date(),
        appVersionId: null,
        organizationId,
        scope: DataSourceScopes.GLOBAL,
      });
    }, manager || this.manager);
  }

  async createDefaultDataSource(kind: string, appVersionId: string, manager?: EntityManager): Promise<DataSource> {
    const newDataSource = manager.create(DataSource, {
      name: `${kind}default`,
      kind,
      appVersionId,
      type: DataSourceTypes.STATIC,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await manager.save(newDataSource);
  }

  findByQuery(dataQueryId: string, organizationId: string, dataSourceId?: string, manager?: EntityManager) {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(DataSource, {
        where: { ...(dataSourceId ? { id: dataSourceId } : {}), dataQueries: { id: dataQueryId } },
        relations: ['dataQueries', 'plugin'],
      });
    }, manager || this.manager);
  }

  getAllStaticDataSources(versionId: string, manager?: EntityManager): Promise<DataSource[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(DataSource, {
        where: { appVersionId: versionId, type: DataSourceTypes.STATIC },
      });
    }, manager || this.manager);
  }

  getDatasourceByKindAndOrg(kind: string, organisationId: string | string[]) {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(DataSource, {
        where: {
          kind: kind,
          organizationId: typeof organisationId === 'string' ? organisationId : In(organisationId),
        },
        relations: ['dataQueries'],
      });
    });
  }

  getQueriesByDatasourceId(datasourceId) {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(DataSource, {
        where: {
          id: datasourceId,
        },
        relations: ['dataQueries'],
      });
    });
  }
}
