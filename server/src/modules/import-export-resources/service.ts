import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { TooljetDbImportExportService } from '@modules/tooljet-db/services/tooljet-db-import-export.service';
import { ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { CloneResourcesDto } from '@dto/clone-resources.dto';
import { isEmpty } from 'lodash';
import { InternalTableRepository } from '@modules/tooljet-db/repository';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { AppsRepository } from '@modules/apps/repository';
import { EntityManager, In } from 'typeorm';
import { InternalTable } from '@entities/internal_table.entity';
import { isLibraryUuid } from '@modules/data-queries/library/library-query.util';
import { dbTransactionWrap } from '@helpers/database.helper';
import {
  libraryTooljetDbTableIds,
  LibraryExportQuery,
  remapLibraryTooljetDbTables,
} from '@modules/data-queries/library/library-export.util';

@Injectable()
export class ImportExportResourcesService {
  constructor(
    protected readonly appImportExportService: AppImportExportService,
    protected readonly tooljetDbImportExportService: TooljetDbImportExportService,
    protected readonly internalTableRepository: InternalTableRepository,
    protected readonly appsRepository: AppsRepository
  ) {}

  async export(
    user: User,
    exportResourcesDto: ExportResourcesDto,
    branchId?: string,
    // Git push/pull never carries library queries: the library is not synced to git.
    { forGit = false }: { forGit?: boolean } = {}
  ): Promise<{
    tooljet_database?: Array<ImportTooljetDatabaseDto>;
    app?: Array<Record<string, any>>; // TODO: Define the type for app
  }> {
    const resourcesExport: {
      tooljet_database?: Array<ImportTooljetDatabaseDto>;
      app?: Array<Record<string, unknown>>;
    } = {};

    if (exportResourcesDto.app?.length) {
      const exportedApps: Record<string, unknown>[] = [];
      for (const app of exportResourcesDto.app) {
        const exportedApp = {
          definition: await this.appImportExportService.export(user, app.id, app.search_params, branchId, {
            withLibraryQueries: !forGit,
          }),
        };
        exportedApps.push(exportedApp);
      }

      if (exportedApps.length > 0) resourcesExport.app = exportedApps;
    }

    // Library queries bring their ToolJet DB tables along, but only when the caller asked for tables at all.
    // Appended to the caller's own array, like the foreign-key tables the table export adds: git push zips that
    // array against the result to map local ids to co_relation_ids.
    const tableList = exportResourcesDto.tooljet_database;
    type ExportedDefinition = { appV2: { libraryQueries?: LibraryExportQuery[] } };
    const libraryQueries = (resourcesExport.app ?? []).flatMap(
      (exportedApp) => (exportedApp.definition as ExportedDefinition).appV2.libraryQueries ?? []
    );
    if (tableList) {
      // A table deleted since the snapshot was taken is skipped by the table export, which would shift git push's
      // index-based mapping of the entries after it. Only append tables that still exist in this workspace.
      const candidateIds = libraryTooljetDbTableIds(libraryQueries).filter(isLibraryUuid);
      const existing = candidateIds.length
        ? await this.internalTableRepository.manager.find(InternalTable, {
            where: { organizationId: exportResourcesDto.organization_id, id: In(candidateIds) },
            select: ['id'],
          })
        : [];
      const existingIds = new Set(existing.map((table) => table.id));
      for (const table_id of candidateIds) {
        if (existingIds.has(table_id) && !tableList.some((table) => table.table_id === table_id)) {
          tableList.push({ table_id });
        }
      }
    }

    if (tableList?.length) {
      const exportedDbs: ImportTooljetDatabaseDto[] = [];
      const portableTables: Record<string, { id: string }> = {};
      for (const tjdb of tableList) {
        const exportedDb = await this.tooljetDbImportExportService.export(
          exportResourcesDto.organization_id,
          tjdb,
          tableList
        );
        if (!exportedDb) continue;
        exportedDbs.push(exportedDb);
        portableTables[tjdb.table_id] = { id: exportedDb.id };
      }
      // Library snapshots still name tables by this workspace's ids; rename them to the ids the tables travel under.
      remapLibraryTooljetDbTables(libraryQueries, (options) =>
        this.appImportExportService.replaceTooljetDbTableIds(
          options,
          portableTables,
          exportResourcesDto.organization_id
        )
      );

      if (exportedDbs.length > 0) resourcesExport.tooljet_database = exportedDbs;
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
    // ToolJet DB tables below commit on their own; refusals an app import would hit must happen before them.
    if (!isEmpty(importResourcesDto.tooljet_database)) {
      const importingUser = Object.assign(new User(), user, {
        organizationId: importResourcesDto.organization_id ?? user.organizationId,
      });
      for (const app of importResourcesDto.app ?? [])
        await this.appImportExportService.assertImportAccess(importingUser, app.definition);
    }
    let tableNameMapping = {};
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
      }

      if (!isEmpty(importResourcesDto.app)) {
        for (const appImportDto of importResourcesDto.app) {
          user.organizationId = importResourcesDto.organization_id;
          const createdApp = await this.appImportExportService.import(
            user,
            appImportDto.definition,
            appImportDto.appName,
            {
              tooljet_database: tableNameMapping,
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

  async legacyImport(user: User, templateDefinition: any, appName: string) {
    const importedApp = await this.appImportExportService.import(user, templateDefinition, appName);
    return {
      app: [importedApp.newApp],
      tooljet_database: [],
    };
  }

  async clone(user: User, { organization_id, app: [{ id: appId, name: newAppName }], branchId }: CloneResourcesDto) {
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
