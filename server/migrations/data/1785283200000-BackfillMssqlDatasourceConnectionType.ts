import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillMssqlDatasourceConnectionType';
const BATCH_SIZE = 500;

// data_source_options was dropped in DropDataSourceOptionsTable1773300000000 (runs before this
// migration by timestamp) once its data was copied to data_source_version_options by
// SeedDefaultDataSourceVersionsForAll1773229180000. Every environment reaching this migration
// has already gone through that consolidation, so this targets the new table directly.
const MISSING_CONNECTION_TYPE_WHERE_CLAUSE = `
  INNER JOIN data_source_versions dsv ON dsv.id = dsvo.data_source_version_id
  INNER JOIN data_sources ds ON ds.id = dsv.data_source_id
  WHERE ds.kind = 'mssql'
    AND NOT (dsvo.options::jsonb ? 'connection_type')
`;

export class BackfillMssqlDatasourceConnectionType1785283200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const [{ count }] = await entityManager.query(
      `SELECT COUNT(*) AS count FROM data_source_version_options dsvo ${MISSING_CONNECTION_TYPE_WHERE_CLAUSE}`
    );
    const totalCount = parseInt(count, 10);

    if (totalCount === 0) {
      console.log(`${MIGRATION_NAME}: no matching mssql datasource version options found.`);
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
              `SELECT dsvo.id FROM data_source_version_options dsvo ${MISSING_CONNECTION_TYPE_WHERE_CLAUSE} ORDER BY dsvo.id LIMIT $1`,
              [take]
            );
          },
          async (transactionManager: EntityManager, rows: { id: string }[]) => {
            const ids = rows.map((row) => row.id);

            await transactionManager.query(
              `UPDATE data_source_version_options
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

    console.log(`${MIGRATION_NAME}: completed. Updated ${totalUpdated} mssql datasource version options.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: remove connection_type only for MSSQL datasources
    await queryRunner.query(`
      UPDATE data_source_version_options dsvo
      SET "options" = ("options"::jsonb - 'connection_type')::json
      FROM data_source_versions dsv, data_sources ds
      WHERE dsv.id = dsvo.data_source_version_id
        AND ds.id = dsv.data_source_id
        AND ds.kind = 'mssql'
    `);
  }
}
