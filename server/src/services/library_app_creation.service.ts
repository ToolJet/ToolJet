import { BadRequestException, Injectable } from '@nestjs/common';
import { App } from '../entities/app.entity';
import { User } from '../entities/user.entity';
import { AppImportExportService } from './app_import_export.service';
import { readFileSync } from 'fs';
import { Logger } from 'nestjs-pino';

@Injectable()
export class LibraryAppCreationService {
  constructor(private readonly appImportExportService: AppImportExportService, private readonly logger: Logger) {}

  async perform(currentUser: User, identifier: string, appName: string): Promise<App> {
    const appDefinition = this.findAppDefinition(identifier);
    const newApp = await this.appImportExportService.import(currentUser, appDefinition, appName);
    return newApp;
  }

  findAppDefinition(identifier: string) {
    let appDefinition: object;

    try {
      appDefinition = JSON.parse(readFileSync(`templates/${identifier}/definition.json`, 'utf-8'));
    } catch (err) {
      this.logger.error(err);
      throw new BadRequestException('App definition not found');
    }

    return appDefinition;
  }
}
