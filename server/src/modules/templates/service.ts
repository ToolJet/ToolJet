import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Logger } from 'nestjs-pino';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { isVersionGreaterThanOrEqual } from 'src/helpers/utils.helper';
import { getMaxCopyNumber } from 'src/helpers/utils.helper';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { TooljetDbBulkUploadService } from '@modules/tooljet-db/services/tooljet-db-bulk-upload.service';
import { User } from '@entities/user.entity';
import { AppsRepository } from '@modules/apps/repository';
import { Like } from 'typeorm';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { PluginsService } from '@modules/plugins/service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { defaultThemeName, TJDefaultTheme } from '@modules/organization-themes/constants';

@Injectable()
export class TemplatesService {
  constructor(
    protected importExportResourcesService: ImportExportResourcesService,
    protected appsRepository: AppsRepository,
    protected tooljetDbBulkUploadService: TooljetDbBulkUploadService,
    protected pluginsService: PluginsService,
    protected logger: Logger
  ) {}

  // Property injection leaves the constructor unchanged for subclasses
  @Inject(LicenseTermsService)
  protected licenseTermsService: LicenseTermsService;

  async perform(
    currentUser: User,
    identifier: string,
    appName: string,
    dependentPlugins: Array<string>,
    shouldAutoImportPlugin: boolean
  ) {
    let templateDefinition = this.findTemplateDefinition(identifier);
    if (!(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.CUSTOM_THEMES, currentUser.organizationId)))
      templateDefinition = this.withThemeColours(templateDefinition);
    if (dependentPlugins.length)
      await this.pluginsService.autoInstallPluginsForTemplates(dependentPlugins, shouldAutoImportPlugin);
    return this.importTemplate(currentUser, templateDefinition, appName, identifier);
  }

  // Free plans ignore app themes: write in their light colours (icons use placeholder text), keep the default theme
  protected withThemeColours(templateDefinition: any) {
    const colours = templateDefinition.app?.[0]?.definition?.appV2?.appVersions?.[0]?.globalSettings?.theme?.definition;
    if (!colours) return templateDefinition;

    const app = JSON.parse(
      JSON.stringify(templateDefinition.app)
        .replace(/"appMode":"auto"/g, '"appMode":"light"')
        .replace(/var\(--cc-default-icon\)/g, 'var(--cc-placeholder-text)')
        .replace(/var\(--cc-(\w+)-(\w+)\)/g, (token, type, group) => colours[group]?.colors?.[type]?.light ?? token)
    );
    const theme = { name: defaultThemeName, definition: TJDefaultTheme };
    app[0].definition.appV2.appVersions.forEach((version) => Object.assign(version.globalSettings ?? {}, { theme }));
    return { ...templateDefinition, app };
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
    const sampleAppDef = this.readTemplateJson('templates/sample_app_def.json');
    return this.importTemplate(currentUser, sampleAppDef, nameWithCount);
  }

  async createSampleOnboardApp(currentUser: User) {
    const name = 'Product inventory';
    const sampleAppDef = this.readTemplateJson('templates/onboard_sample_app.json');
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
          // Seed one table at a time, in definition order: foreign keys already exist at this point,
          // so a referencing table must wait until the table it points to has its rows.
          await this.processCsvFile(identifier, tableNameAsPerDefinition, newTableid, currentUser.organizationId);
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
      return this.readTemplateJson(`templates/${identifier}/definition.json`);
    } catch (err) {
      this.logger.error(err);
      throw new BadRequestException('App definition not found');
    }
  }

  // Templates may be stored Brotli-compressed as `<file>.br`; fall back to the plain JSON file.
  protected readTemplateJson(filePath: string) {
    const compressedPath = `${filePath}.br`;
    const contents = fs.existsSync(compressedPath)
      ? zlib.brotliDecompressSync(readFileSync(compressedPath))
      : readFileSync(filePath);
    return JSON.parse(contents.toString('utf-8'));
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
