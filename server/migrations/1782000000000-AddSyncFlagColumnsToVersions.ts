import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSyncFlagColumnsToVersions1782000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_synced / is_git_sync in the SCHEMA phase. All `migrations/` run before all
    // `data-migrations/`, so creating the columns here guarantees they exist before any
    // data-migration runs.
    //
    // Why this is needed: old data-migrations query the AppVersion / DataSourceVersion
    // entities (e.g. data-migrations/1625814801430-UpdateDefinitionsForEvents), and the
    // entities now map is_synced / is_git_sync. TypeORM's entity SELECT lists every mapped
    // column, so those migrations fail with "column is_synced does not exist" — the
    // data-migrations that originally introduced these columns
    // (1781740900000 / 1781741000000) run *after* the old entity-based ones.
    //
    // IF NOT EXISTS keeps this idempotent and order-independent with those data-migrations:
    //   - fresh install: columns created here; the data-migrations' own `ADD COLUMN IF NOT
    //     EXISTS` become no-ops but their backfills / NOT NULL / triggers still run.
    //   - existing install that already ran the data-migrations: columns present → no-op here.
    await queryRunner.query(`ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS is_synced boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS is_git_sync boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE data_source_versions ADD COLUMN IF NOT EXISTS is_synced boolean NOT NULL DEFAULT false`
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: these columns are owned by the gitsync data-migrations
    // (1781740900000 / 1781741000000); they handle the drop on rollback.
  }
}
