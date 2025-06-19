import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
export class ReplaceTheSampleDBConnectionValues1749766677207 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    // If edition is not cloud, skip this migration
    if (edition !== 'cloud') {
      console.log('Migration is only restricted for cloud edition.');
      return; // Exit the migration early
    }
    const { SampleDataSourceService } = await import(
      `${await getImportPath(true, edition)}/data-sources/services/sample-ds.service`
    );
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    const dataSourceService = app.get(SampleDataSourceService);
    await dataSourceService.updateSampleDs(queryRunner.manager);
    await app.close();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
