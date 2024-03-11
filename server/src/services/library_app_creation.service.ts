import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { readFileSync } from 'fs';
import { Logger } from 'nestjs-pino';
import { ImportExportResourcesService } from './import_export_resources.service';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { AppImportExportService } from './app_import_export.service';
import { isVersionGreaterThanOrEqual } from 'src/helpers/utils.helper';

@Injectable()
export class LibraryAppCreationService {
  constructor(
    private readonly importExportResourcesService: ImportExportResourcesService,
    private readonly appImportExportService: AppImportExportService,
    private readonly logger: Logger
  ) {}

  async perform(currentUser: User, identifier: string, appName: string) {
    const templateDefinition = this.findTemplateDefinition(identifier);
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
