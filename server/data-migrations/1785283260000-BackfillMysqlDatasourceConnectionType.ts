import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillMysqlDatasourceConnectionType';
const BATCH_SIZE = 500;

// Old mysql datasources stored the "hostname"/"socket_path" choice directly under connection_type
// (or never had connection_type at all). The current schema uses connection_type for
// "manual" vs "string" (connection string) and a separate protocol field for "hostname"/"socket"
// ("socket_path" was renamed to "socket"). Datasources already on the new format
// ("manual" or "string") must be left untouched.
//
// data_source_options was dropped in DropDataSourceOptionsTable1773300000000 (runs before this
// migration by timestamp) once its data was copied to data_source_version_options by
// ConsolidatedBranchModelSetup1773500000000. Every environment reaching this migration has
// already gone through that consolidation, so this targets the new table directly.
const LEGACY_FORMAT_WHERE_CLAUSE = `
  INNER JOIN data_source_versions dsv ON dsv.id = dsvo.data_source_version_id
  INNER JOIN data_sources ds ON ds.id = dsv.data_source_id
  WHERE ds.kind = 'mysql'
    AND (
      NOT (dsvo.options::jsonb ? 'connection_type')
      OR (dsvo.options::jsonb -> 'connection_type' ->> 'value') IN ('hostname', 'socket_path')
    )
`;

export class BackfillMysqlDatasourceConnectionType1785283260000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const [{ count }] = await entityManager.query(
      `SELECT COUNT(*) AS count FROM data_source_version_options dsvo ${LEGACY_FORMAT_WHERE_CLAUSE}`
    );
    const totalCount = parseInt(count, 10);

    if (totalCount === 0) {
      console.log(`${MIGRATION_NAME}: no matching mysql datasource version options found.`);
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
              `SELECT dsvo.id FROM data_source_version_options dsvo ${LEGACY_FORMAT_WHERE_CLAUSE} ORDER BY dsvo.id LIMIT $1`,
              [take]
            );
          },
          async (transactionManager: EntityManager, rows: { id: string }[]) => {
            const ids = rows.map((row) => row.id);

            await transactionManager.query(
              `UPDATE data_source_version_options
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

    console.log(`${MIGRATION_NAME}: completed. Updated ${totalUpdated} mysql datasource version options.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: after up(), migrated rows and datasources that were already created on the new
    // "manual" + protocol format are indistinguishable, so a safe targeted rollback isn't possible.
  }
}
