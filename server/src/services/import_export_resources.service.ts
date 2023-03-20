import { Inject, Injectable, Optional } from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { ExportResourcesDto } from '@dto/export-resources.dto';
import { AppImportExportService } from './app_import_export.service';
import { TooljetDbImportExportService } from './tooljet_db_import_export_service';
import { ImportResourcesDto } from '@dto/import-resources.dto';

@Injectable()
export class ImportExportResourcesService {
  constructor(
    private readonly appImportExportService: AppImportExportService,
    @Optional()
    @Inject(TooljetDbImportExportService)
    private readonly tooljetDbImportExportService: TooljetDbImportExportService
  ) {}

  async export(user: User, exportResourcesDto: ExportResourcesDto) {
    const resourcesExport = {};
    if (exportResourcesDto.tooljet_database) {
      resourcesExport['tooljet_database'] = [];

      for (const tjdb of exportResourcesDto.tooljet_database) {
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

  async import(user: User, importResourcesDto: ImportResourcesDto) {
    const tableNameMapping = {};

    if (importResourcesDto.tooljet_database) {
      for (const tjdbImportDto of importResourcesDto.tooljet_database) {
        tableNameMapping[tjdbImportDto.id] = await this.tooljetDbImportExportService.import(
          importResourcesDto.organization_id,
          tjdbImportDto
        );
      }
    }

    if (importResourcesDto.app) {
      for (const appImportDto of importResourcesDto.app) {
        user.organizationId = importResourcesDto.organization_id;
        await this.appImportExportService.import(user, appImportDto.definition, { tooljet_database: tableNameMapping });
      }
    }

    return true;
  }
}
