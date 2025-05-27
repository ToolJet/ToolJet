import { Injectable } from '@nestjs/common';
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
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class ImportExportResourcesService {
  constructor(
    protected readonly appImportExportService: AppImportExportService,
    protected readonly tooljetDbImportExportService: TooljetDbImportExportService,
    protected readonly internalTableRepository: InternalTableRepository
  ) {}

  async export(
    user: User,
    exportResourcesDto: ExportResourcesDto
  ): Promise<{
    tooljet_database?: Array<ImportTooljetDatabaseDto>;
    app?: Array<Record<string, any>>; // TODO: Define the type for app
  }> {
    const resourcesExport: {
      tooljet_database?: Array<ImportTooljetDatabaseDto>;
      app?: Array<Record<string, unknown>>;
    } = {};

    if (exportResourcesDto.tooljet_database?.length) {
      const exportedDbs: ImportTooljetDatabaseDto[] = [];
      for (const tjdb of exportResourcesDto.tooljet_database) {
        const exportedDb = await this.tooljetDbImportExportService.export(
          exportResourcesDto.organization_id,
          tjdb,
          exportResourcesDto.tooljet_database
        );
        exportedDbs.push(exportedDb);
      }

      if (exportedDbs.length > 0) resourcesExport.tooljet_database = exportedDbs;
    }

    if (exportResourcesDto.app?.length) {
      const exportedApps: Record<string, unknown>[] = [];
      for (const app of exportResourcesDto.app) {
        const exportedApp = {
          definition: await this.appImportExportService.export(user, app.id, app.search_params),
        };
        exportedApps.push(exportedApp);
      }

      if (exportedApps.length > 0) resourcesExport.app = exportedApps;
    }

    return resourcesExport;
  }

  async import(
    user: User,
    importResourcesDto: ImportResourcesDto,
    cloning = false,
    isGitApp = false,
    isTemplateApp = false
  ) {
    let tableNameMapping = {};
    const imports = { app: [], tooljet_database: [], tableNameMapping: {} };
    const importingVersion = importResourcesDto.tooljet_version;

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
            manager
          );

          imports.app.push({ id: createdApp.id, name: createdApp.name });

          RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, {
            userId: user.id,
            organizationId: user.organizationId,
            resourceId: createdApp.id,
            resourceName: createdApp.name,
          });
        }
      }

      return imports;
    });
  }

  async legacyImport(user: User, templateDefinition: any, appName: string) {
    const importedApp = await this.appImportExportService.import(user, templateDefinition, appName);
    return {
      app: [importedApp],
      tooljet_database: [],
    };
  }

  async clone(user: User, { organization_id, app: [{ id: appId, name: newAppName }] }: CloneResourcesDto) {
    const tablesForApp = await this.internalTableRepository.findTables(appId);
    const exportResourcesDto: ExportResourcesDto = {
      organization_id,
      app: [{ id: appId, search_params: null }],
      tooljet_database: tablesForApp,
    };

    const resourceExport = await this.export(user, exportResourcesDto);
    // TODO: Verify if this is required as we always pass name on imports
    // Without this appImportExportService.import will throw an error
    resourceExport.app[0].definition.appV2.name = newAppName;

    const importResourcesDto: ImportResourcesDto = {
      organization_id,
      tooljet_version: globalThis.TOOLJET_VERSION,
      app: [
        {
          appName: newAppName,
          definition: resourceExport.app[0].definition,
        },
      ],
      tooljet_database: resourceExport.tooljet_database,
    };

    return this.import(user, importResourcesDto, true);
  }
}
