import { Injectable } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { AppImportExportService } from './app_import_export.service';
import { TooljetDbImportExportService } from './tooljet_db_import_export_service';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { AppsService } from './apps.service';
import { CloneResourcesDto } from '@dto/clone-resources.dto';
import { isEmpty } from 'lodash';
import { AuditLoggerService } from './audit_logger.service';
import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';

@Injectable()
export class ImportExportResourcesService {
  constructor(
    private readonly appImportExportService: AppImportExportService,
    private readonly appsService: AppsService,
    private readonly tooljetDbImportExportService: TooljetDbImportExportService,
    private readonly auditLoggerService: AuditLoggerService
  ) {}

  async export(user: User, exportResourcesDto: ExportResourcesDto) {
    const resourcesExport = {};
    if (exportResourcesDto.tooljet_database) {
      resourcesExport['tooljet_database'] = [];

      for (const tjdb of exportResourcesDto.tooljet_database) {
        !isEmpty(tjdb) &&
          resourcesExport['tooljet_database'].push(
            await this.tooljetDbImportExportService.export(exportResourcesDto.organization_id, tjdb)
          );
      }
    }

    if (exportResourcesDto.app) {
      resourcesExport['app'] = [];

      for (const app of exportResourcesDto.app) {
        resourcesExport['app'].push({
          definition: await this.appImportExportService.export(user, app.id, app.search_params),
        });
      }
    }

    return resourcesExport;
  }

  async import(user: User, importResourcesDto: ImportResourcesDto, cloning = false) {
    const tableNameMapping = {};
    const imports = { app: [], tooljet_database: [] };

    if (importResourcesDto.tooljet_database) {
      for (const tjdbImportDto of importResourcesDto.tooljet_database) {
        const createdTable = await this.tooljetDbImportExportService.import(
          importResourcesDto.organization_id,
          tjdbImportDto,
          cloning
        );
        tableNameMapping[tjdbImportDto.id] = createdTable;
        imports.tooljet_database.push(createdTable);
      }
    }

    if (importResourcesDto.app) {
      for (const appImportDto of importResourcesDto.app) {
        user.organizationId = importResourcesDto.organization_id;
        const createdApp = await this.appImportExportService.import(user, appImportDto.definition, {
          tooljet_database: tableNameMapping,
        });
        imports.app.push({ id: createdApp.id, name: createdApp.name });

        await this.auditLoggerService.perform({
          userId: user.id,
          organizationId: user.organizationId,
          resourceId: createdApp.id,
          resourceType: ResourceTypes.APP,
          resourceName: createdApp.name,
          actionType: ActionTypes.APP_CREATE,
        });
      }
    }

    return imports;
  }

  async clone(user: User, cloneResourcesDto: CloneResourcesDto) {
    const tablesForApp = await this.appsService.findTooljetDbTables(cloneResourcesDto.app[0].id);

    const exportResourcesDto = new ExportResourcesDto();
    exportResourcesDto.organization_id = cloneResourcesDto.organization_id;
    exportResourcesDto.app = [{ id: cloneResourcesDto.app[0].id, search_params: null }];
    exportResourcesDto.tooljet_database = tablesForApp;

    const resourceExport = await this.export(user, exportResourcesDto);
    resourceExport['organization_id'] = cloneResourcesDto.organization_id;
    const clonedResource = await this.import(user, resourceExport as ImportResourcesDto, true);

    return clonedResource;
  }
}
