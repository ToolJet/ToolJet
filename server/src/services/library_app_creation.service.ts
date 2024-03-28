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

@Injectable()
export class LibraryAppCreationService {
  constructor(
    private readonly importExportResourcesService: ImportExportResourcesService,
    private readonly appImportExportService: AppImportExportService,
    private readonly appsService: AppsService,
    private readonly logger: Logger
  ) {}

  async perform(currentUser: User, identifier: string, appName: string) {
    const templateDefinition = this.findTemplateDefinition(identifier);
    return this.importTemplate(currentUser, templateDefinition, appName);
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

  async importTemplate(currentUser: User, templateDefinition: any, appName: string) {
    const importDto = new ImportResourcesDto();
    importDto.organization_id = currentUser.organizationId;
    importDto.app = templateDefinition.app || templateDefinition.appV2;
    importDto.tooljet_database = templateDefinition.tooljet_database;
    importDto.tooljet_version = templateDefinition.tooljet_version;

    if (isVersionGreaterThanOrEqual(templateDefinition.tooljet_version, '2.16.0')) {
      importDto.app[0].appName = appName;
      return await this.importExportResourcesService.import(currentUser, importDto);
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
}
