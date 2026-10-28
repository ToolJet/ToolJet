import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { Organization } from '@entities/organization.entity';
export class ReplaceTheSampleDBConnectionValues1731279588337 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    const organizationsCount = await manager.count(Organization);

    if (organizationsCount === 0) {
      console.log('No organizations found, skipping migration.');
      return;
    }

    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    // If edition is not cloud, skip this migration
    if (edition !== TOOLJET_EDITIONS.Cloud) {
      console.log('Migration is only restricted for cloud edition.');
      return; // Exit the migration early
    }
    console.log(edition, 'edition');

    const { SampleDataSourceService } = await import(
      `${await getImportPath(true, edition)}/data-sources/services/sample-ds.service`
    );
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const dataSourceService = nestApp.get(SampleDataSourceService);
    await dataSourceService.updateSampleDs(queryRunner.manager);
    await nestApp.close();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
