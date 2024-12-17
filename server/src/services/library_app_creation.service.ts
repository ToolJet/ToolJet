import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { readFileSync } from 'fs';
import { Logger } from 'nestjs-pino';
import { ImportExportResourcesService } from './import_export_resources.service';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { AppImportExportService } from './app_import_export.service';
import { isVersionGreaterThanOrEqual } from 'src/helpers/utils.helper';
import { AppsService } from './apps.service';
import { getMaxCopyNumber } from 'src/helpers/utils.helper';
import * as fs from 'fs';
import * as path from 'path';
import { TooljetDbBulkUploadService } from '@services/tooljet_db_bulk_upload.service';
import { PluginsService } from './plugins.service';

@Injectable()
export class LibraryAppCreationService {
  constructor(
    private readonly importExportResourcesService: ImportExportResourcesService,
    private readonly appImportExportService: AppImportExportService,
    private readonly appsService: AppsService,
    private readonly logger: Logger,
    private readonly tooljetDbBulkUploadService: TooljetDbBulkUploadService,
    private readonly pluginsService: PluginsService
  ) {}

  async perform(currentUser: User, identifier: string, appName: string) {
    const templateDefinition = this.findTemplateDefinition(identifier);
    return this.importTemplate(currentUser, templateDefinition, appName, identifier);
  }

  async createSampleApp(currentUser: User) {
    let name = 'Sample app ';
    const allSampleApps = await this.appsService.findAll(currentUser?.organizationId, { name });
    const existNameList = allSampleApps.map((app) => app.name);
    const maxNumber = getMaxCopyNumber(existNameList, ' ');
    name = `${name} ${maxNumber}`;
    const sampleAppDef = JSON.parse(readFileSync(`templates/sample_app_def.json`, 'utf-8'));
    return this.importTemplate(currentUser, sampleAppDef, name);
  }

  async createSampleOnboardApp(currentUser: User) {
    const name = 'Product inventory';
    const sampleAppDef = JSON.parse(readFileSync(`templates/onboard_sample_app.json`, 'utf-8'));
    return this.importTemplate(currentUser, sampleAppDef, name);
  }

  async importTemplate(currentUser: User, templateDefinition: any, appName: string, identifier?: string) {
    const importDto = new ImportResourcesDto();
    importDto.organization_id = currentUser.organizationId;
    importDto.app = templateDefinition.app || templateDefinition.appV2;
    importDto.tooljet_database = templateDefinition.tooljet_database;
    importDto.tooljet_version = templateDefinition.tooljet_version;

    const dataSourcesUsedInApps = [];
    importDto.app.forEach((appDefinition) => {
      appDefinition.definition.appV2.dataSources.forEach((dataSource) => {
        dataSourcesUsedInApps.push(dataSource);
      });
    });
    const pluginsToBeInstalled = await this.pluginsService.checkIfPluginsToBeInstalled(dataSourcesUsedInApps);
    await this.pluginsService.autoInstallPluginsForTemplates(pluginsToBeInstalled, false);

    if (isVersionGreaterThanOrEqual(templateDefinition.tooljet_version, '2.16.0')) {
      importDto.app[0].appName = appName;
      const importedResources = await this.importExportResourcesService.import(
        currentUser,
        importDto,
        false,
        false,
        true
      );

      const tableNameMapping: { [key: string]: { id: string; table_name: string } } =
        importedResources.tableNameMapping;
      const entries = Object.entries(tableNameMapping);

      for (let i = 0; i < entries.length; i++) {
        const [key, { id: tableId }] = entries[i];
        const tableIdFromDefinition = key;
        const newTableid = tableId;

        const tableDetails = templateDefinition.tooljet_database.find(
          (table: Record<string, any>) => table.id === tableIdFromDefinition
        );

        if (tableDetails) {
          const tableNameAsPerDefinition = tableDetails.table_name;
          const columns = tableDetails.schema.columns;

          this.processCsvFile(identifier, tableNameAsPerDefinition, newTableid, currentUser.organizationId, columns);
        }
      }

      return importedResources;
    } else {
      const importedApp = await this.appImportExportService.import(currentUser, templateDefinition, appName);
      return {
        app: [importedApp],
        tooljet_database: [],
      };
    }
  }

  findTemplateDefinition(identifier: string) {
    try {
      return JSON.parse(readFileSync(`templates/${identifier}/definition.json`, 'utf-8'));
    } catch (err) {
      this.logger.error(err);
      throw new BadRequestException('App definition not found');
    }
  }
  async processCsvFile(identifier: string, tableName: string, tableId: string, organizationId: string, columns: []) {
    try {
      const csvFilePath = path.join('templates', `${identifier}/data/${tableName}/data.csv`);

      // Read the CSV file and convert it into a buffer
      const fileBuffer = fs.readFileSync(csvFilePath);

      return await this.tooljetDbBulkUploadService.bulkUploadCsv(tableId, columns, fileBuffer, organizationId);
    } catch (error) {
      console.error('Error processing CSV file:', error);
      throw new BadRequestException('Failed to process CSV file');
    }
  }
}
