import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'UpdatePostgresqlAndMySQLPrimaryKeyColumnVariableToPrimaryKeyColumns';
const BATCH_SIZE = 100;

export class UpdatePostgresqlAndMySQLPrimaryKeyColumnVariableToPrimaryKeyColumns1776977100104 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const [{ count }] = await entityManager.query(`
      SELECT COUNT(*) AS count
      FROM data_queries dq
      INNER JOIN data_sources ds ON ds.id = dq.data_source_id
      WHERE ds.kind IN ('postgresql', 'mysql')
        AND ds.type = 'default'
        AND dq.options::jsonb ? 'primary_key_column'
    `);

    const totalCount = parseInt(count, 10);

    if (totalCount === 0) {
      console.log(`${MIGRATION_NAME}: no matching data queries found.`);
      return;
    }

    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalCount);
    let totalUpdated = 0;

    try {
      await entityManager.transaction(async (transactionManager: EntityManager) => {
        await processDataInBatches(
          transactionManager,
          async (transactionManager: EntityManager, _skip: number, take: number) => {
            return await transactionManager.query(
              `
              SELECT dq.id
              FROM data_queries dq
              INNER JOIN data_sources ds ON ds.id = dq.data_source_id
              WHERE ds.kind IN ('postgresql', 'mysql')
                AND ds.type = 'default'
                AND dq.options::jsonb ? 'primary_key_column'
              ORDER BY dq.id
              LIMIT $1
            `,
              [take]
            );
          },
          async (transactionManager: EntityManager, dataQueryRows: { id: string }[]) => {
            const dataQueryIds = dataQueryRows.map((dataQueryRow) => dataQueryRow.id);

            await transactionManager.query(
              `
              UPDATE data_queries
              SET options = (
                (options::jsonb - 'primary_key_column') ||
                jsonb_build_object('primary_key_columns', options::jsonb -> 'primary_key_column')
              )::json
              WHERE id = ANY($1)
            `,
              [dataQueryIds]
            );

            totalUpdated += dataQueryIds.length;
            dataQueryRows.forEach(() => migrationProgress.show());
          },
          BATCH_SIZE
        );
      });
    } catch (error) {
      console.error(`Error during ${MIGRATION_NAME} migration:`, error);
      throw error;
    }

    console.log(`${MIGRATION_NAME}: completed. Updated ${totalUpdated} data queries.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
