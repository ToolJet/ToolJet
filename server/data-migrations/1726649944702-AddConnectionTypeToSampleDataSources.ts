import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';

export class AddConnectionTypeToSampleDataSources1726649944702 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const app = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }), {
      logger: ['error', 'warn'],
    });
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const { SampleDataSourceService } = await import(
      `${await getImportPath(true, edition)}/data-sources/services/sample-ds.service`
    );

    const dataSourceService = app.get(SampleDataSourceService);
    await dataSourceService.updateSampleDs(queryRunner.manager);
    await app.close();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
