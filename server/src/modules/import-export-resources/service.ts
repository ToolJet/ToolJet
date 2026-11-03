import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { TooljetDbImportExportService } from '@modules/tooljet-db/services/tooljet-db-import-export.service';
import { ImportAppDto, ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { CloneResourcesDto } from '@dto/clone-resources.dto';
import { isEmpty } from 'lodash';
import { addTablesInJoinOperation, InternalTableRepository } from '@modules/tooljet-db/repository';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { AppsRepository } from '@modules/apps/repository';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';

interface ExportedJoinTable {
  from?: { name?: string };
  joins?: unknown;
  fields?: unknown;
  aggregates?: unknown;
  group_by?: unknown;
}

interface ExportedQuery {
  kind?: string;
  dataSourceId?: string;
  options?: { table_id?: string; tableId?: string; join_table?: ExportedJoinTable };
}

interface ExportedAppDefinition {
  dataSources?: { id?: string; kind?: string }[];
  dataQueries?: ExportedQuery[];
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

// Every table id a ToolJet DB query of the imported apps names, in the places
// AppImportExportService.replaceTooljetDbTableIds rewrites. A module's queries are left out: an export
// lists only the tables the app's own queries name, so a module's tables are never in the file.
// Reads whatever shape the file has - it runs on every import that carries tables, so it must not throw.
export function collectTjdbTableRefs(apps: ImportAppDto[]): Set<string> {
  const refs = new Set<string>();

  for (const app of apps) {
    const definition: ExportedAppDefinition | undefined = app?.definition?.appV2;
    const tjdbDataSourceIds = new Set(
      asArray<{ id?: string; kind?: string }>(definition?.dataSources)
        .filter((dataSource) => dataSource?.kind === 'tooljetdb')
        .map((dataSource) => dataSource.id)
    );
    for (const query of asArray<ExportedQuery>(definition?.dataQueries)) {
      const options = query?.options;
      // Older exports give a query no kind, only its data source.
      if (!options || (query.kind !== 'tooljetdb' && !tjdbDataSourceIds.has(query.dataSourceId))) continue;
      const tableId = options.table_id ?? options.tableId;
      if (tableId) refs.add(tableId);
      const { from, joins, fields, aggregates, group_by } = asRecord(options.join_table) as ExportedJoinTable;
      if (from?.name) refs.add(from.name);
      addTablesInJoinOperation(refs, asArray<Record<string, unknown>>(joins).filter(Boolean));
      for (const field of asArray<{ table?: string }>(fields)) if (field?.table) refs.add(field.table);
      for (const aggregate of Object.values(asRecord(aggregates))) {
        const aggregateTableId = asRecord(aggregate).table_id;
        if (typeof aggregateTableId === 'string') refs.add(aggregateTableId);
      }
      Object.keys(asRecord(group_by)).forEach((groupTableId) => refs.add(groupTableId));
    }
  }
  return refs;
}

// Exports made between v3.21.13-beta and the co_relation rewrite of their queries name each table by
// its co_relation_id, but leave the queries on the source workspace's internal id, and nothing in the
// file links the two. Returns internal id -> exported table id for the refs the file proves:
//  - a foreign key names its target table and that table's internal id;
//  - one unmatched ref and one table nothing else accounts for belong together.
// Anything else stays out - a query on the wrong table is worse than a query on none.
export function legacyTableRefsToEntryIds(
  tables: ImportTooljetDatabaseDto[],
  apps: ImportAppDto[]
): Record<string, string> {
  const refs = collectTjdbTableRefs(apps);
  const entryIds = new Set(tables.map(({ id }) => id));
  const unresolved = [...refs].filter((ref) => !entryIds.has(ref));
  if (unresolved.length === 0) return {};

  const entryIdBySourceId: Record<string, string> = {};
  const accountedFor = new Set([...refs].filter((ref) => entryIds.has(ref)));
  for (const table of tables) {
    for (const foreignKey of asArray<{ referenced_table_id?: string; referenced_table_name?: string }>(
      table.schema?.foreign_keys
    )) {
      const target = tables.find(({ table_name }) => table_name === foreignKey?.referenced_table_name);
      if (!target) continue;
      accountedFor.add(target.id);
      if (unresolved.includes(foreignKey.referenced_table_id)) {
        entryIdBySourceId[foreignKey.referenced_table_id] = target.id;
      }
    }
  }

  const unmatched = unresolved.filter((ref) => !(ref in entryIdBySourceId));
  const unclaimed = tables.filter(({ id }) => !accountedFor.has(id));
  // ponytail: wrong if the export lists a table the app's queries do not name (the export covers every
  // version of an app) while the only table they do name was deleted. Drop this rule to keep only
  // the foreign-key matches.
  if (unmatched.length === 1 && unclaimed.length === 1) entryIdBySourceId[unmatched[0]] = unclaimed[0].id;
  return entryIdBySourceId;
}

@Injectable()
export class ImportExportResourcesService {
  private readonly logger = new Logger(ImportExportResourcesService.name);

  constructor(
    protected readonly appImportExportService: AppImportExportService,
    protected readonly tooljetDbImportExportService: TooljetDbImportExportService,
    protected readonly internalTableRepository: InternalTableRepository,
    protected readonly appsRepository: AppsRepository
  ) {}

  async export(
    user: User,
    exportResourcesDto: ExportResourcesDto,
    branchId?: string
  ): Promise<{
    tooljet_database?: Array<ImportTooljetDatabaseDto>;
    app?: Array<Record<string, any>>; // TODO: Define the type for app
  }> {
    const resourcesExport: {
      tooljet_database?: Array<ImportTooljetDatabaseDto>;
      app?: Array<Record<string, unknown>>;
    } = {};

    const coRelationIdByTableId: Record<string, string> = {};
    if (exportResourcesDto.tooljet_database?.length) {
      const exportedDbs: ImportTooljetDatabaseDto[] = [];
      // export() appends the tables foreign keys reference, so this loop visits those too
      for (const tjdb of exportResourcesDto.tooljet_database) {
        const exportedDb = await this.tooljetDbImportExportService.export(
          exportResourcesDto.organization_id,
          tjdb,
          exportResourcesDto.tooljet_database
        );
        if (!exportedDb) continue;
        exportedDbs.push(exportedDb);
        coRelationIdByTableId[tjdb.table_id] = exportedDb.id;
      }

      if (exportedDbs.length > 0) resourcesExport.tooljet_database = exportedDbs;
    }

    if (exportResourcesDto.app?.length) {
      const exportedApps: Record<string, unknown>[] = [];
      for (const app of exportResourcesDto.app) {
        const definition = await this.appImportExportService.export(user, app.id, app.search_params, branchId);
        if (!isEmpty(coRelationIdByTableId)) {
          this.appImportExportService.pointTooljetDbQueriesAtCoRelationIds(definition, coRelationIdByTableId);
        }
        exportedApps.push({ definition });
      }

      if (exportedApps.length > 0) resourcesExport.app = exportedApps;
    }

    if (exportResourcesDto.app?.length) {
      const appData = await this.appsRepository.findOne({
        where: { id: exportResourcesDto.app[0].id },
      });
      //APP_EXPORT audit
      const auditLogsData = {
        userId: user.id,
        organizationId: user.organizationId,
        resourceId: appData.id,
        resourceName: appData.name,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    }
    return resourcesExport;
  }

  async import(
    user: User,
    importResourcesDto: ImportResourcesDto,
    cloning = false,
    isGitApp = false,
    isTemplateApp = false,
    manager?: EntityManager
  ) {
    // Reject cross-org organization_id (tj-ee#5465).
    if (importResourcesDto.organization_id !== user.organizationId) {
      throw new ForbiddenException('Cannot import resources into a different organization.');
    }

    let tableNameMapping: Record<string, { id: string }> = {};
    // tableNameMapping plus the internal ids of legacy exports (see legacyTableRefsToEntryIds)
    let queryTableMapping: Record<string, { id: string }> = {};
    const imports = { app: [], tooljet_database: [], tableNameMapping: {} };
    const importingVersion = importResourcesDto.tooljet_version;
    const skipPermissionsGroupCheck = importResourcesDto.skip_permissions_group_check;

    if (!isEmpty(importResourcesDto.app) && !skipPermissionsGroupCheck) {
      for (const appImportDto of importResourcesDto.app) {
        let appParams = appImportDto.definition;
        if (appParams?.appV2) {
          appParams = { ...appParams.appV2 };
          const pages = appParams?.pages;
          const queries = appParams?.dataQueries;
          const components = appParams?.components;
          if (pages?.length || queries?.length || components?.length)
            await this.appImportExportService.checkIfGroupPermissionsExist(
              pages,
              queries,
              components,
              user.organizationId
            );
        }
      }
    }

    return await dbTransactionWrap(async (manager) => {
      if (!isEmpty(importResourcesDto.tooljet_database)) {
        const res = await this.tooljetDbImportExportService.bulkImport(importResourcesDto, importingVersion, cloning);
        tableNameMapping = res.tableNameMapping;
        imports.tooljet_database = res.tooljet_database;
        imports.tableNameMapping = tableNameMapping;

        // Git files name tables by co_relation_id on both sides and list tables across every version of
        // an app, so the recovery below does not apply to them.
        queryTableMapping = isGitApp
          ? { ...tableNameMapping }
          : { ...tableNameMapping, ...(await this.mapLegacyTableRefs(importResourcesDto, tableNameMapping)) };
      }

      if (!isEmpty(importResourcesDto.app)) {
        for (const appImportDto of importResourcesDto.app) {
          // organization_id is already validated == user.organizationId above — no override needed.
          const createdApp = await this.appImportExportService.import(
            user,
            appImportDto.definition,
            appImportDto.appName,
            {
              tooljet_database: queryTableMapping,
            },
            isGitApp,
            importResourcesDto.tooljet_version,
            cloning,
            manager,
            importResourcesDto.branchId,
            isTemplateApp
          );

          imports.app.push({ id: createdApp.newApp.id, name: createdApp.newApp.name });

          RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
            userId: user.id,
            organizationId: user.organizationId,
            resourceId: createdApp.newApp.id,
            resourceName: createdApp.newApp.name,
          });
        }
      }

      return imports;
    }, manager);
  }

  // Maps the query table ids a legacy export left on the source workspace (see legacyTableRefsToEntryIds)
  // to the tables this import created, and warns about the ids it could not place. It runs after the
  // tables are committed, so a failure here must not fail the import and orphan them: it logs and
  // leaves the mapping as the table import returned it.
  private async mapLegacyTableRefs(
    importResourcesDto: ImportResourcesDto,
    tableNameMapping: Record<string, { id: string }>
  ): Promise<Record<string, { id: string }>> {
    try {
      const apps = importResourcesDto.app ?? [];
      const entryIdBySourceId = legacyTableRefsToEntryIds(importResourcesDto.tooljet_database, apps);
      const allRefs = apps.flatMap((app) => [...collectTjdbTableRefs([app])]);
      // An id this workspace already has is valid as it stands (a same-workspace import), not a leftover.
      const existingTableIds = await this.internalTableRepository.findExistingIds(
        [...new Set(allRefs)],
        importResourcesDto.organization_id
      );

      const mapping: Record<string, { id: string }> = {};
      for (const [sourceId, entryId] of Object.entries(entryIdBySourceId)) {
        if (!existingTableIds.has(sourceId) && tableNameMapping[entryId]) mapping[sourceId] = tableNameMapping[entryId];
      }

      const importedTableIds = new Set(Object.values(tableNameMapping).map(({ id }) => id));
      for (const app of apps) {
        const unmapped = new Set(
          [...collectTjdbTableRefs([app])].filter(
            (ref) =>
              !(ref in tableNameMapping) &&
              !(ref in mapping) &&
              !importedTableIds.has(ref) &&
              !existingTableIds.has(ref)
          )
        );
        if (unmapped.size) {
          this.logger.warn(
            `Import of ${JSON.stringify(app.appName)}: ToolJet DB query table ids not in the import: ${[...unmapped]
              .slice(0, 10)
              .join(', ')}`
          );
        }
      }
      return mapping;
    } catch (error) {
      this.logger.warn(`Could not map legacy ToolJet DB table ids on import: ${(error as Error).message}`);
      return {};
    }
  }

  async legacyImport(user: User, templateDefinition: any, appName: string) {
    const importedApp = await this.appImportExportService.import(user, templateDefinition, appName);
    return {
      app: [importedApp.newApp],
      tooljet_database: [],
    };
  }

  async clone(user: User, { organization_id, app: [{ id: appId, name: newAppName }], branchId }: CloneResourcesDto) {
    // Same check as import() — export() below reads tooljet_database before that check would run.
    if (organization_id !== user.organizationId) {
      throw new ForbiddenException('Cannot clone resources into a different organization.');
    }

    const tablesForApp = await this.internalTableRepository.findTables(appId);
    const exportResourcesDto: ExportResourcesDto = {
      organization_id,
      app: [{ id: appId, search_params: null }],
      tooljet_database: tablesForApp,
    };

    const resourceExport = await this.export(user, exportResourcesDto);

    // Prevent cloning a stub app (pulled from git but not yet hydrated — has no pages).
    // AppVersion.isStub is a real DB column (is_stub, default false) — reliable to check here.
    const exportedVersions: any[] = resourceExport.app?.[0]?.definition?.appV2?.appVersions ?? [];
    const hasNonStubVersion = exportedVersions.some((v: any) => !v.isStub);
    if (exportedVersions.length > 0 && !hasNonStubVersion) {
      throw new BadRequestException(
        'App contents are still syncing from Git. Open the app to finish loading, then try again.'
      );
    }

    // TODO: Verify if this is required as we always pass name on imports
    // Without this appImportExportService.import will throw an error
    resourceExport.app[0].definition.appV2.name = newAppName;

    // Clear the source app's slug so the import generates a fresh one from the
    // new app's id. Without this the (slug, branch_id) unique index is violated
    // because the source and clone live on the same branch.
    delete resourceExport.app[0].definition.appV2.slug;
    for (const ver of exportedVersions) {
      delete ver.slug;
    }

    const importResourcesDto: ImportResourcesDto = {
      organization_id,
      tooljet_version: globalThis.TOOLJET_VERSION,
      ...(branchId && { branchId }),
      app: [
        {
          appName: newAppName,
          definition: resourceExport.app[0].definition,
        },
      ],
      tooljet_database: resourceExport.tooljet_database,
    };

    const createdApp = await this.import(user, importResourcesDto, true);
    //APP_CLONE audit
    RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
      userId: user.id,
      organizationId: user.organizationId,
      resourceId: createdApp.app[0]?.id,
      resourceName: createdApp.app[0]?.name,
    });
    return createdApp;
  }
}
