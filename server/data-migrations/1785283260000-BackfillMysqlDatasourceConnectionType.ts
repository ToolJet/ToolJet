import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillMysqlDatasourceConnectionType';
const BATCH_SIZE = 500;

// Old mysql datasources stored the "hostname"/"socket_path" choice directly under connection_type
// (or never had connection_type at all). The current schema uses connection_type for
// "manual" vs "string" (connection string) and a separate protocol field for "hostname"/"socket"
// ("socket_path" was renamed to "socket"). Datasources already on the new format
// ("manual" or "string") must be left untouched.
const LEGACY_FORMAT_WHERE_CLAUSE = `
  INNER JOIN data_sources ds ON ds.id = dso.data_source_id
  WHERE ds.kind = 'mysql'
    AND (
      NOT (dso.options::jsonb ? 'connection_type')
      OR (dso.options::jsonb -> 'connection_type' ->> 'value') IN ('hostname', 'socket_path')
    )
`;

export class BackfillMysqlDatasourceConnectionType1785283260000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const [{ count }] = await entityManager.query(
      `SELECT COUNT(*) AS count FROM data_source_options dso ${LEGACY_FORMAT_WHERE_CLAUSE}`
    );
    const totalCount = parseInt(count, 10);

    if (totalCount === 0) {
      console.log(`${MIGRATION_NAME}: no matching mysql datasource options found.`);
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
              `SELECT dso.id FROM data_source_options dso ${LEGACY_FORMAT_WHERE_CLAUSE} ORDER BY dso.id LIMIT $1`,
              [take]
            );
          },
          async (transactionManager: EntityManager, rows: { id: string }[]) => {
            const ids = rows.map((row) => row.id);

            await transactionManager.query(
              `UPDATE data_source_options
               SET "options" = (
                 ("options"::jsonb - 'connection_type')
                 || jsonb_build_object(
                      'connection_type', jsonb_build_object('value', 'manual', 'encrypted', false),
                      'protocol', jsonb_build_object(
                        'value', CASE
                                   WHEN "options"::jsonb -> 'connection_type' ->> 'value' = 'socket_path' THEN 'socket'
                                   ELSE COALESCE("options"::jsonb -> 'connection_type' ->> 'value', 'hostname')
                                 END,
                        'encrypted', false
                      )
                    )
               )::json
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

    console.log(`${MIGRATION_NAME}: completed. Updated ${totalUpdated} mysql datasource options.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: after up(), migrated rows and datasources that were already created on the new
    // "manual" + protocol format are indistinguishable, so a safe targeted rollback isn't possible.
  }
}
