import { DataSource } from '@entities/data_source.entity';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource as typeOrmDS, EntityManager, Repository } from 'typeorm';
import { UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { dbTransactionWrap } from '@helpers/database.helper';
import { DataSourceScopes, DataSourceTypes } from './constants';
import { DefaultDataSourceKind, GetQueryVariables } from './types';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { decode } from 'js-base64';

@Injectable()
export class DataSourcesRepository extends Repository<DataSource> {
  constructor(private dataSource: typeOrmDS) {
    super(DataSource, dataSource.createEntityManager());
  }

  // ----- default-branch resolution for data_source_versions -----------------------------
  //
  // `is_default` was dropped from data_source_versions; the canonical / gitsync-off fallback
  // DSV is now the row whose branch_id = the org's DEFAULT workspace branch
  // (organization_git_sync_branches.is_default = true). Every org always has a default branch
  // (seeded on creation / backfilled by EnsureDefaultBranchForAllOrganizations).
  //
  // These are static, stateless query helpers (they operate on the passed EntityManager), so
  // they're callable from free functions and transaction callbacks that hold a manager but no
  // repository instance — import the class and call them directly.

  // The org's default workspace branch id (null only if the org has none, which shouldn't happen).
  static async resolveDefaultBranchId(manager: EntityManager, organizationId: string): Promise<string | null> {
    if (!organizationId) return null;
    const branch = await manager.findOne(WorkspaceBranch, {
      where: { organizationId, isDefault: true },
      select: ['id'],
    });
    return branch?.id ?? null;
  }

  // Same, resolved from a data source — joins data_sources → its org's default branch.
  static async resolveDefaultBranchIdForDataSource(
    manager: EntityManager,
    dataSourceId: string
  ): Promise<string | null> {
    if (!dataSourceId) return null;
    const row = await manager
      .createQueryBuilder(WorkspaceBranch, 'wb')
      .innerJoin(DataSource, 'ds', 'ds.organization_id = wb.organization_id')
      .where('ds.id = :dataSourceId', { dataSourceId })
      .andWhere('wb.is_default = true')
      .select('wb.id', 'id')
      .getRawOne();
    return row?.id ?? null;
  }

  // The DSV on the data source's org default branch — the canonical / gitsync-off fallback row
  // that replaces the old `{ dataSourceId, isDefault: true }` lookup. Pass activeOnly to also
  // require is_active = true.
  static async findDefaultDsvForDataSource(
    manager: EntityManager,
    dataSourceId: string,
    opts: { activeOnly?: boolean } = {}
  ): Promise<DataSourceVersion | null> {
    const defaultBranchId = await DataSourcesRepository.resolveDefaultBranchIdForDataSource(manager, dataSourceId);
    if (!defaultBranchId) return null;
    const where: Record<string, unknown> = { dataSourceId, branchId: defaultBranchId };
    if (opts.activeOnly) where.isActive = true;
    return manager.findOne(DataSourceVersion, { where });
  }

  async allGlobalDS(
    userPermissions: UserPermissions,
    organizationId: string,
    queryVars: GetQueryVariables
  ): Promise<DataSource[]> {
    const { environmentId, types, branchId } = queryVars;
    // appVersionId removed from queryVars: released versions now use is_default DSV
    // Data source options are attached only if selectedEnvironmentId is passed
    // Returns global data sources + sample data sources
    // If version Id is passed, then data queries under each are also returned
    const dataSourcePermissions = userPermissions[MODULES.GLOBAL_DATA_SOURCE];
    const isAllUsableConfigurable = dataSourcePermissions.isAllConfigurable || dataSourcePermissions.isAllUsable;
    const canPerformCreateOrDelete = userPermissions.dataSourceCreate || userPermissions.dataSourceDelete;
    const isSuperAdmin = userPermissions.isSuperAdmin;
    const isAdmin = userPermissions.isAdmin;

    const manager = this.manager;
    // Canonical / gitsync-off fallback DSV now lives on the org default branch (the old
    // is_default = true row). Resolve it once for the fallback joins below.
    const defaultBranchId = await DataSourcesRepository.resolveDefaultBranchId(manager, organizationId);
    const query = manager
      .createQueryBuilder(DataSource, 'data_source')
        .leftJoinAndSelect('data_source.plugin', 'plugin')
        .leftJoinAndSelect('plugin.iconFile', 'iconFile')
        .leftJoinAndSelect('plugin.manifestFile', 'manifestFile')
        .leftJoinAndSelect('plugin.operationsFile', 'operationsFile');

      const useBranchPath = !!(branchId && environmentId);

      if (useBranchPath) {
        // Branch-aware: prefer branch-specific DSV, fall back to default DSV
        // query.leftJoin(
        //   'data_source_versions',
        //   'dsv',
        //   `dsv.data_source_id = data_source.id AND (
        //     (dsv.branch_id = :branchId AND dsv.is_active = true)
        //     OR (
        //       dsv.is_default = true
        //       AND NOT EXISTS (
        //         SELECT 1 FROM data_source_versions dsv2
        //         WHERE dsv2.data_source_id = data_source.id
        //           AND dsv2.branch_id = :branchId
        //       )
        //     )
        //   )`,
        //   { branchId }
        // );
        query.leftJoin(
         'data_source_versions',
         'dsv',
         `dsv.data_source_id = data_source.id
          AND dsv.branch_id = :branchId
          AND dsv.is_active = true`,
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
              dsv.branch_id = :defaultBranchId
              AND dsv.is_active = true
              AND NOT EXISTS (
                SELECT 1 FROM data_source_versions dsv2
                WHERE dsv2.data_source_id = data_source.id
                  AND dsv2.branch_id = :branchId
              )
            )
          )`,
          { branchId, defaultBranchId }
        );
        query.addSelect(['dsv.id', 'dsv.name']);
      } else if (environmentId) {
        // Released versions now read from the org default-branch DSV (the row whose
        // branch_id = the default workspace branch — formerly is_default = true).
        // Removed: appVersionId-specific DSV lookup (app_version_id dropped from data_source_versions).
        query.leftJoin(
          'data_source_versions',
          'dsv',
          'dsv.data_source_id = data_source.id AND dsv.branch_id = :defaultBranchId AND dsv.is_active = true',
          { defaultBranchId }
        );
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
              // Removed: appVersionId-based data query join (app_version_id dropped from data_source_versions).
              // if (appVersionId) {
              //   query.leftJoin('data_source.dataQueries', 'data_queries');
              //   qb.orWhere('data_queries.app_version_id = :appVersionId', { appVersionId });
              // }
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
        // Static data sources don't have DSV entries, so always allow them through
        query.andWhere('(dsv.id IS NOT NULL OR data_source.type = :staticType)', {
          staticType: DataSourceTypes.STATIC,
        });
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

      const rawById = new Map<string, any>();
      for (const r of rawResults) {
        if (!rawById.has(r.data_source_id)) rawById.set(r.data_source_id, r);
      }

      //remove tokenData from restapi datasources
      const dataSources = dataSourceList?.map((ds) => {
        if (useBranchPath || branchId) {
          const rawRow = rawById.get(ds.id);
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
          const rawRow = rawById.get(ds.id);
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
  }

  async findById(dataSourceId: string, organizationId: string, manager?: EntityManager): Promise<DataSource> {
    const m = manager ?? this.manager;
    return m.findOneOrFail(DataSource, {
      where: { id: dataSourceId, organizationId },
      relations: ['plugin', 'apps'],
    });
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
    const m = manager ?? this.manager;
    return m.findOneOrFail(DataSource, { where: { organizationId, type: DataSourceTypes.STATIC, kind } });
  }

  findByQuery(dataQueryId: string, organizationId: string, dataSourceId?: string, manager?: EntityManager) {
    const m = manager ?? this.manager;
    return m.findOne(DataSource, {
      where: { ...(dataSourceId ? { id: dataSourceId } : {}), dataQueries: { id: dataQueryId }, organizationId },
      relations: ['dataQueries', 'plugin'],
    });
  }

  getDatasourceByPluginId(pluginId: string) {
    return this.manager.find(DataSource, { where: { pluginId }, relations: ['dataQueries'] });
  }

  getQueriesByDatasourceId(datasourceId: string, branchId?: string | null) {
    if (branchId) {
      return this.manager
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
    return this.manager.find(DataSource, { where: { id: datasourceId }, relations: ['dataQueries'] });
  }
}
