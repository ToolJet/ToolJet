import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress } from '@helpers/migration.helper';
import { processDataInBatches } from '@helpers/utils.helper';
import { dbTransactionWrap } from '@helpers/database.helper';

export class UpdateRestApiClientAuthInOauth1751258388314 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const totalRecords = await entityManager.query(
      `
      SELECT COUNT(*)
      FROM data_source_options dso
      JOIN data_sources ds ON dso.data_source_id = ds.id
      WHERE ds.kind = $1
      AND dso.options->'auth_type'->>'value' = $2
    `,
      ['restapi', 'oauth2']
    );

    const totalCount = parseInt(totalRecords[0].count);
    if (totalCount === 0) {
      console.log('No records found to update for RestAPI client auth in OAuth.');
      return;
    }

    await this.updateRestAPIClientAuthInOauth(entityManager, totalCount);
  }

  private async updateRestAPIClientAuthInOauth(entityManager: EntityManager, totalCount): Promise<void> {
    return dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress('UpdateRestApiClientAuthInOauth1750057586596', totalCount);
      const batchSize = 100;

      const fetchDataSourceOptionsInBatches = async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.query(
          `
          SELECT dso.id, dso.options, ds.name, dso.environment_id
          FROM data_source_options dso
          JOIN data_sources ds ON dso.data_source_id = ds.id
          WHERE ds.kind = $1
          AND dso.options->'auth_type'->>'value' = $2
          ORDER BY dso.id
          LIMIT $3 OFFSET $4
      `,
          ['restapi', 'oauth2', take, skip]
        );
      };

      const processDataSourceOptionsBatch = async (entityManager: EntityManager, dataSourceOptions: any[]) => {
        for (const dataSourceOption of dataSourceOptions) {
          const options = dataSourceOption.options;
          if (options) {
            const currentClientAuth = options?.client_auth?.value;

            if (currentClientAuth === 'body') {
              migrationProgress.show();
              continue;
            }

            options.client_auth = { value: 'body', encrypted: false };
            await entityManager.query(
              `
            UPDATE data_source_options
            SET options = $1
            WHERE id = $2
        `,
              [options, dataSourceOption.id]
            );
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

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
