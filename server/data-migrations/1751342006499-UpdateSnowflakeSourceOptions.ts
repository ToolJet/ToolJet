import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { dbTransactionWrap } from '@helpers/database.helper';

export class UpdateSnowflakeSourceOptions1751342006499 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const totalRecords = await entityManager.query(
      `
        SELECT COUNT(*) 
        FROM data_source_options dso
        JOIN data_sources ds ON dso.data_source_id = ds.id
        WHERE ds.kind = $1

        `,
      ['snowflake']
    );
    const totalCount = parseInt(totalRecords[0].count);
    if (totalCount === 0) {
      console.log('No records found to update for Snowflake data sources.');
      return;
    }
    await this.updateSnowflakeSourceOptions(entityManager, totalCount);
  }

  private async updateSnowflakeSourceOptions(entityManager: EntityManager, totalCount: number): Promise<void> {
    return dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress('UpdateSnowflakeSourceOptions1751342006499', totalCount);
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
          ['snowflake', take, skip]
        );
      };

      const processDataSourceOptionsBatch = async (entityManager: EntityManager, dataSourceOptions: any[]) => {
        for (const dataSourceOption of dataSourceOptions) {
          const options = dataSourceOption.options;
          if (options) {
            options.auth_type = { value: 'basic', encrypted: false };
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
