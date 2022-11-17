import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import {
  convertAppDefinitionFromSinglePageToMultiPage,
  convertAppDefinitionFromMultiPageToSinglePage,
} from '../lib/single-page-to-and-from-multipage-definition-conversion';

export class ChangeDefinitionStructureForMultiPage1668521091918 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);
    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const newDefinition = convertAppDefinitionFromSinglePageToMultiPage(definition);
        version.definition = newDefinition;
        await entityManager.update(AppVersion, { id: version.id }, { definition: newDefinition });
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);
    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const newDefinition = convertAppDefinitionFromMultiPageToSinglePage(definition);
        version.definition = newDefinition;
        await entityManager.update(AppVersion, { id: version.id }, { definition: newDefinition });
      }
    }
  }
}
