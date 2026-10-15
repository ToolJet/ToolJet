import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';

const MIGRATION_NAME = 'UseDedicatedRoleForSampleDataSource';

export class UseDedicatedRoleForSampleDataSource1792045132000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition = getTooljetEdition() as TOOLJET_EDITIONS;
    const { SampleDataSourceService } = await import(
      `${await getImportPath(true, edition)}/data-sources/services/sample-ds.service`
    );
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    try {
      const sampleDataSourceService = nestApp.get(SampleDataSourceService);

      console.log(`${MIGRATION_NAME}: [START] Provision sample database role`);
      try {
        const provisioned = await sampleDataSourceService.provisionRestrictedRole();
        if (!provisioned) {
          console.log(`${MIGRATION_NAME}: [SUCCESS] SAMPLE_PG_DB_USER is set; keeping operator-supplied credentials.`);
          return;
        }
        console.log(`${MIGRATION_NAME}: [SUCCESS] Sample database role provisioned.`);
      } catch (error) {
        console.error(
          `${MIGRATION_NAME}: [ERROR] Could not provision the sample database role (${error?.message}). ` +
            'Keeping existing sample data source credentials. Set SAMPLE_PG_DB_USER/SAMPLE_PG_DB_PASS ' +
            'to a dedicated user, or run `npm run db:sample:reset` with an admin that can create roles.'
        );
        return;
      }

      console.log(`${MIGRATION_NAME}: [START] Point sample data sources at the dedicated role`);
      await sampleDataSourceService.updateSampleDs(queryRunner.manager);
      console.log(`${MIGRATION_NAME}: [SUCCESS] Sample data sources updated.`);
    } finally {
      await nestApp.close();
    }
  }

  public async down(): Promise<void> {}
}
