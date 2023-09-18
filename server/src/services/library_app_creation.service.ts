import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { readFileSync } from 'fs';
import { Logger } from 'nestjs-pino';
import { ImportExportResourcesService } from './import_export_resources.service';
import { ImportResourcesDto } from '@dto/import-resources.dto';

@Injectable()
export class LibraryAppCreationService {
  constructor(
    private readonly importExportResourcesService: ImportExportResourcesService,
    private readonly logger: Logger
  ) {}

  async perform(currentUser: User, identifier: string) {
    const templateDefinition = this.findTemplateDefinition(identifier);

    const importDto = new ImportResourcesDto();
    importDto.organization_id = currentUser.organizationId;
    importDto.app = templateDefinition.app || templateDefinition.appV2;
    importDto.tooljet_database = templateDefinition.tooljet_database;

    const result = await this.importExportResourcesService.import(currentUser, importDto);

    return result;
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
