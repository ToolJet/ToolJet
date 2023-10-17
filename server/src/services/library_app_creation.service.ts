import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { readFileSync } from 'fs';
import { Logger } from 'nestjs-pino';
import { ImportExportResourcesService } from './import_export_resources.service';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { AppImportExportService } from './app_import_export.service';

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

    if (this.isVersionGreaterThanOrEqual(templateDefinition.tooljet_version, '2.16.0')) {
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

  isVersionGreaterThanOrEqual(version1: string, version2: string) {
    if (!version1) return false;

    const v1Parts = version1.split('-')[0].split('.').map(Number);
    const v2Parts = version2.split('-')[0].split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = +v1Parts[i] || 0;
      const v2Part = +v2Parts[i] || 0;

      if (v1Part < v2Part) {
        return false;
      } else if (v1Part > v2Part) {
        return true;
      }
    }

    return true;
  }
}
