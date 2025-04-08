import { BadRequestException, Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Logger } from 'nestjs-pino';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { isVersionGreaterThanOrEqual } from 'src/helpers/utils.helper';
import { getMaxCopyNumber } from 'src/helpers/utils.helper';
import * as fs from 'fs';
import * as path from 'path';
import { TooljetDbBulkUploadService } from '@modules/tooljet-db/services/tooljet-db-bulk-upload.service';
import { User } from '@entities/user.entity';
import { AppsRepository } from '@modules/apps/repository';
import { Like } from 'typeorm';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { PluginsService } from '@modules/plugins/service';

@Injectable()
export class TemplatesService {
  constructor(
    protected importExportResourcesService: ImportExportResourcesService,
    protected appsRepository: AppsRepository,
    protected tooljetDbBulkUploadService: TooljetDbBulkUploadService,
    protected pluginsService: PluginsService,
    protected logger: Logger
  ) {}

  async perform(
    currentUser: User,
    identifier: string,
    appName: string,
    dependentPluginsForTemplate: Array<string>,
    shouldAutoImportPlugin: boolean
  ) {
    const templateDefinition = this.findTemplateDefinition(identifier);
    if (dependentPluginsForTemplate.length)
      await this.pluginsService.autoInstallPluginsForTemplates(dependentPluginsForTemplate, shouldAutoImportPlugin);
    return this.importTemplate(currentUser, templateDefinition, appName, identifier);
  }

  async createSampleApp(currentUser: User) {
    const name = 'Sample app ';
    const allSampleApps = await this.appsRepository.find({
      where: {
        organizationId: currentUser.organizationId,
        name: Like(`${name}%`),
      },
    });
    const existNameList = allSampleApps.map((app) => app.name);
    const maxNumber = getMaxCopyNumber(existNameList, ' ');
    const nameWithCount = `${name} ${maxNumber}`;
    const sampleAppDef = JSON.parse(readFileSync(`templates/sample_app_def.json`, 'utf-8'));
    return this.importTemplate(currentUser, sampleAppDef, nameWithCount);
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

    if (isVersionGreaterThanOrEqual(templateDefinition.tooljet_version, '2.16.0')) {
      importDto.app[0].appName = appName;
      const importedResources = await this.importExportResourcesService.import(
        currentUser,
        importDto,
        false,
        false,
        true
      );

      const tableNameMapping: {
        [key: string]: { id: string; table_name: string };
      } = importedResources.tableNameMapping;
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
          this.processCsvFile(identifier, tableNameAsPerDefinition, newTableid, currentUser.organizationId);
        }
      }

      return importedResources;
    } else {
      const importedApp = await this.importExportResourcesService.legacyImport(
        currentUser,
        templateDefinition,
        appName
      );

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
  async processCsvFile(identifier: string, tableName: string, tableId: string, organizationId: string) {
    try {
      const csvFilePath = path.join('templates', `${identifier}/data/${tableName}/data.csv`);

      if (fs.existsSync(csvFilePath)) {
        // Read the CSV file and convert it into a buffer
        const fileBuffer = fs.readFileSync(csvFilePath);
        return await this.tooljetDbBulkUploadService.bulkUploadCsv(tableId, fileBuffer, organizationId);
      }
    } catch (error) {
      console.error('Error processing CSV file:', error);
      throw new BadRequestException('Failed to process CSV file');
    }
  }

  async findDepedentPluginsFromTemplateDefinition(identifier: string) {
    const templateDefinition = this.findTemplateDefinition(identifier);
    const importDto = new ImportResourcesDto();
    importDto.app = templateDefinition.app || templateDefinition.appV2;

    const dataSourcesUsedInApps = [];
    importDto.app.forEach((appDefinition) => {
      appDefinition.definition?.appV2.dataSources.forEach((dataSource) => {
        dataSourcesUsedInApps.push(dataSource);
      });
    });
    const { pluginsToBeInstalled, pluginsListIdToDetailsMap } = await this.pluginsService.checkIfPluginsToBeInstalled(
      dataSourcesUsedInApps
    );
    return { pluginsToBeInstalled, pluginsListIdToDetailsMap };
  }
}
