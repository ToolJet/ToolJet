import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces co_relation_id is always populated on `apps`. Other tables
 * (pages, components, layouts, data_sources, data_queries, event_handlers,
 * data_query_folders, data_query_folder_mappings, internal_tables, app_versions)
 * keep co_relation_id nullable for now — backfill / runtime paths populate them
 * opportunistically, and making them mandatory caused chain failures during git
 * pull / hydrate where partial entity loads emit UPDATEs that clear the column.
 *
 * `apps` stays mandatory because the application code (AppsRepository, pull stub
 * creation, ModuleViewer cross-env resolution) treats apps.co_relation_id as a
 * stable passport and assumes it's always set.
 */
export class AddCoRelationIdNotNullConstraints1777200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // The backfill UPDATE and the SET NOT NULL validation scan below both walk the
    // whole apps table — disable statement_timeout for this transaction so neither is
    // cancelled (57014) on a large instance. SET LOCAL reverts on commit/rollback.
    await queryRunner.query(`SET LOCAL statement_timeout = 0`);

    // Safety backfill: 1777100000000 already filled rows that existed when it ran,
    // but rows inserted between that migration and this one (or in environments where
    // the prior backfill missed cases) can still be NULL. Copy the row's own id so the
    // constraint can be added without violation.
    await queryRunner.query(`UPDATE apps SET co_relation_id = id WHERE co_relation_id IS NULL;`);
    await queryRunner.query(`
      ALTER TABLE apps
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE apps
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);
  }
}
