import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { dbTransactionWrap } from '@helpers/database.helper';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getTooljetEdition } from '@helpers/utils.helper';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';

export class EncrpyGoogleCalendarClientSecret1752749046662 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;

    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const { CredentialsService } = await import(
      `${await getImportPath(true, edition)}/encryption/services/credentials.service`
    );
    const credentialsService = nestApp.get(CredentialsService);

    const totalRecords = await entityManager.query(
      `
        SELECT COUNT(*) 
        FROM data_source_options dso
        JOIN data_sources ds ON dso.data_source_id = ds.id
        WHERE ds.kind = $1
      `,
      ['googlecalendar']
    );

    const totalCount = parseInt(totalRecords[0].count);
    if (totalCount === 0) {
      console.log('No records found to update for Google Calendar data sources.');
      await nestApp.close();
      return;
    }

    await this.updateGoogleCalendarClientSecrets(entityManager, totalCount, credentialsService);
    await nestApp.close();
  }

  private async updateGoogleCalendarClientSecrets(
    entityManager: EntityManager,
    totalCount: number,
    credentialsService
  ): Promise<void> {
    return dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress('EncrpyGoogleCalendarClientSecret1752749046662', totalCount);
      const batchSize = 100;

      const fetchDataSourceOptionsInBatches = async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.query(
          `
          SELECT dso.id, dso.options, ds.name, dso.environment_id
          FROM data_source_options dso
          JOIN data_sources ds ON dso.data_source_id = ds.id
          WHERE ds.kind = $1
          ORDER BY dso.id
          LIMIT $2 OFFSET $3
          `,
          ['googlecalendar', take, skip]
        );
      };

      const processDataSourceOptionsBatch = async (entityManager: EntityManager, dataSourceOptions: any[]) => {
        for (const dataSourceOption of dataSourceOptions) {
          const options = dataSourceOption.options;

          if (options && options.client_secret) {
            if (!options.client_secret.encrypted && options.client_secret.value) {
              const credential = await credentialsService.create(options.client_secret.value, entityManager);

              options.client_secret = {
                credential_id: credential.id,
                encrypted: true,
              };

              await entityManager.query(
                `
                UPDATE data_source_options
                SET options = $1
                WHERE id = $2
                `,
                [options, dataSourceOption.id]
              );
            }
          }

          migrationProgress.show();
        }
      };

      await processDataInBatches(
        entityManager,
        fetchDataSourceOptionsInBatches,
        processDataSourceOptionsBatch,
        batchSize
      );
    }, entityManager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
