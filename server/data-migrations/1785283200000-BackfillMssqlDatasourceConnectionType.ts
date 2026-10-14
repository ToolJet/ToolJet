import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillMssqlDatasourceConnectionType';
const BATCH_SIZE = 500;

const MISSING_CONNECTION_TYPE_WHERE_CLAUSE = `
  INNER JOIN data_sources ds ON ds.id = dso.data_source_id
  WHERE ds.kind = 'mssql'
    AND NOT (dso.options::jsonb ? 'connection_type')
`;

export class BackfillMssqlDatasourceConnectionType1785283200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const [{ count }] = await entityManager.query(
      `SELECT COUNT(*) AS count FROM data_source_options dso ${MISSING_CONNECTION_TYPE_WHERE_CLAUSE}`
    );
    const totalCount = parseInt(count, 10);

    if (totalCount === 0) {
      console.log(`${MIGRATION_NAME}: no matching mssql datasource options found.`);
      return;
    }

    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalCount);
    let totalUpdated = 0;

    try {
      await entityManager.transaction(async (transactionManager: EntityManager) => {
        await processDataInBatches(
          transactionManager,
          // Processed rows leave the WHERE clause after update, so always fetch from offset 0.
          async (transactionManager: EntityManager, _skip: number, take: number) => {
            return await transactionManager.query(
              `SELECT dso.id FROM data_source_options dso ${MISSING_CONNECTION_TYPE_WHERE_CLAUSE} ORDER BY dso.id LIMIT $1`,
              [take]
            );
          },
          async (transactionManager: EntityManager, rows: { id: string }[]) => {
            const ids = rows.map((row) => row.id);

            await transactionManager.query(
              `UPDATE data_source_options
               SET "options" = ("options"::jsonb || '{"connection_type": {"value": "manual", "encrypted": false}}'::jsonb)::json
               WHERE id = ANY($1)`,
              [ids]
            );

            totalUpdated += ids.length;
            rows.forEach(() => migrationProgress.show());
          },
          BATCH_SIZE
        );
      });
    } catch (error) {
      console.error(`Error during ${MIGRATION_NAME} migration:`, error);
      throw error;
    }

    console.log(`${MIGRATION_NAME}: completed. Updated ${totalUpdated} mssql datasource options.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: remove connection_type only for MSSQL datasources
    await queryRunner.query(`
      UPDATE data_source_options dso
      SET "options" = ("options"::jsonb - 'connection_type')::json
      FROM data_sources ds
      WHERE ds.id = dso.data_source_id
        AND ds.kind = 'mssql'
    `);
  }
}
