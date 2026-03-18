import { DataSource } from '@entities/data_source.entity';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource as typeOrmDS, EntityManager, Repository } from 'typeorm';
import { UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataSourceScopes, DataSourceTypes } from './constants';
import { DefaultDataSourceKind, GetQueryVariables } from './types';
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
    const { appVersionId, environmentId, types, branchId } = queryVars;
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

      const useBranchPath = !!(branchId && environmentId);

      if (useBranchPath) {
        // Branch-aware: prefer branch-specific DSV, fall back to default DSV
        query.leftJoin(
          'data_source_versions',
          'dsv',
          `dsv.data_source_id = data_source.id AND (
            (dsv.branch_id = :branchId AND dsv.is_active = true)
            OR (
              dsv.is_default = true
              AND NOT EXISTS (
                SELECT 1 FROM data_source_versions dsv2
                WHERE dsv2.data_source_id = data_source.id
                  AND dsv2.branch_id = :branchId
                  AND dsv2.is_active = true
              )
            )
          )`,
          { branchId }
        );
        query.leftJoin(
          'data_source_version_options',
          'dsvo',
          'dsvo.data_source_version_id = dsv.id AND dsvo.environment_id = :environmentId',
          { environmentId }
        );
        // Select version-specific columns so they appear in raw results
        query.addSelect(['dsv.id', 'dsv.name', 'dsvo.options']);
      } else if (branchId) {
        // Branch-aware but no environmentId: prefer branch DSV, fall back to default
        query.leftJoin(
          'data_source_versions',
          'dsv',
          `dsv.data_source_id = data_source.id AND (
            (dsv.branch_id = :branchId AND dsv.is_active = true)
            OR (
              dsv.is_default = true
              AND NOT EXISTS (
                SELECT 1 FROM data_source_versions dsv2
                WHERE dsv2.data_source_id = data_source.id
                  AND dsv2.branch_id = :branchId
                  AND dsv2.is_active = true
              )
            )
          )`,
          { branchId }
        );
        query.addSelect(['dsv.id', 'dsv.name']);
      } else if (environmentId) {
        // Join through data_source_versions → data_source_version_options
        // Prefer version-specific DSV (by appVersionId), fall back to default DSV
        if (appVersionId) {
          query.leftJoin(
            'data_source_versions',
            'dsv',
            `dsv.data_source_id = data_source.id AND (
              dsv.app_version_id = :appVersionId
              OR (
                dsv.is_default = true
                AND NOT EXISTS (
                  SELECT 1 FROM data_source_versions dsv2
                  WHERE dsv2.data_source_id = data_source.id AND dsv2.app_version_id = :appVersionId
                )
              )
            )`,
            { appVersionId }
          );
        } else {
          query.leftJoin(
            'data_source_versions',
            'dsv',
            'dsv.data_source_id = data_source.id AND dsv.is_default = true'
          );
        }
        query.leftJoin(
          'data_source_version_options',
          'dsvo',
          'dsvo.data_source_version_id = dsv.id AND dsvo.environment_id = :environmentId',
          { environmentId }
        );
        query.addSelect(['dsv.id', 'dsv.name', 'dsvo.options']);
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

      if (types && types.length > 0) {
        query.andWhere('data_source.type IN (:...types)', { types });
      }
      if (environmentId && !useBranchPath && !branchId) {
        // Filter: DS must have options in version table for this env
        query.andWhere('dsvo.id IS NOT NULL');
      }
      if (useBranchPath || branchId) {
        // Filter: DS must have at least a DSV (branch-specific or default fallback)
        query.andWhere('dsv.id IS NOT NULL');
      }
      let result: DataSource[];
      let rawResults: any[] = [];

      if (useBranchPath || branchId || environmentId) {
        // Use getRawAndEntities to get both entity data and raw dsv/dsvo columns
        const rawAndEntities = await query.getRawAndEntities();
        result = rawAndEntities.entities;
        rawResults = rawAndEntities.raw;
      } else {
        result = await query.getMany();
      }

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
        if (useBranchPath || branchId) {
          // Find the matching raw row to get dsv/dsvo columns
          const rawRow = rawResults.find((r) => r.data_source_id === ds.id);
          if (rawRow) {
            // Overlay version-specific name from data_source_versions
            if (rawRow.dsv_name) {
              ds.name = rawRow.dsv_name;
            }
            // Attach version id for frontend reference
            (ds as any).versionId = rawRow.dsv_id || null;
          }

          if (useBranchPath && rawRow) {
            // Options from data_source_version_options
            const rawOptions = rawRow.dsvo_options || {};
            const parsedOptions = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions;
            if (ds.kind === 'restapi') {
              const options = {};
              Object.keys(parsedOptions).filter((key) => {
                if (key !== 'tokenData') {
                  return (options[key] = parsedOptions[key]);
                }
              });
              ds.options = options;
            } else {
              ds.options = { ...parsedOptions };
            }
          }
        } else if (environmentId) {
          // Non-branch with environmentId: use version options
          const rawRow = rawResults.find((r) => r.data_source_id === ds.id);
          const rawOptions = rawRow?.dsvo_options;
          if (rawOptions) {
            const parsedOptions = typeof rawOptions === 'string' ? JSON.parse(rawOptions) : rawOptions;
            if (ds.kind === 'restapi') {
              const options = {};
              Object.keys(parsedOptions).filter((key) => {
                if (key !== 'tokenData') {
                  return (options[key] = parsedOptions[key]);
                }
              });
              ds.options = options;
            } else {
              ds.options = { ...parsedOptions };
            }
            if (rawRow?.dsv_name) {
              ds.name = rawRow.dsv_name;
            }
          } else {
            ds.options = {};
          }
        } else {
          ds.options = {};
        }
        delete ds['dataSourceOptions'];
        return ds;
      });

      return dataSources;
    });
  }

  async findById(dataSourceId: string, organizationId: string, manager?: EntityManager): Promise<DataSource> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOneOrFail(DataSource, {
        where: { id: dataSourceId, organizationId },
        relations: ['plugin', 'apps'],
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

  async createDefaultDataSource(kind: string, organizationId: string, manager?: EntityManager): Promise<DataSource> {
    const newDataSource = manager.create(DataSource, {
      name: `${kind}default`,
      kind,
      scope: DataSourceScopes.GLOBAL,
      organizationId,
      type: DataSourceTypes.STATIC,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return await manager.save(newDataSource);
  }

  async getStaticDataSources(organizationId: string, manager?: EntityManager): Promise<DataSource[]> {
    return await manager.find(DataSource, {
      where: { organizationId, type: DataSourceTypes.STATIC },
    });
  }

  async getStaticDataSourceByKind(
    organizationId: string,
    kind: DefaultDataSourceKind,
    manager?: EntityManager
  ): Promise<DataSource> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOneOrFail(DataSource, {
        where: { organizationId, type: DataSourceTypes.STATIC, kind },
      });
    }, manager || this.manager);
  }

  findByQuery(dataQueryId: string, organizationId: string, dataSourceId?: string, manager?: EntityManager) {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(DataSource, {
        where: { ...(dataSourceId ? { id: dataSourceId } : {}), dataQueries: { id: dataQueryId }, organizationId },
        relations: ['dataQueries', 'plugin'],
      });
    }, manager || this.manager);
  }

  getDatasourceByPluginId(pluginId: string) {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(DataSource, {
        where: {
          pluginId: pluginId,
        },
        relations: ['dataQueries'],
      });
    });
  }

  getQueriesByDatasourceId(datasourceId: string, branchId?: string | null) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      if (branchId) {
        return manager
          .createQueryBuilder(DataSource, 'ds')
          .leftJoinAndSelect(
            'ds.dataQueries',
            'dq',
            'dq.app_version_id IN (SELECT av.id FROM app_versions av WHERE av.branch_id = :branchId)',
            { branchId }
          )
          .where('ds.id = :datasourceId', { datasourceId })
          .getMany();
      }

      return manager.find(DataSource, {
        where: { id: datasourceId },
        relations: ['dataQueries'],
      });
    });
  }
}
