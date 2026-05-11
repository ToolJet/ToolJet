import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces co_relation_id is always populated after the backfill in 1777100000000.
 *
 * For every table EXCEPT app_versions:
 *   - SET NOT NULL  — safe because 1777100000000 already filled every NULL row.
 *   - SET DEFAULT gen_random_uuid() — DB generates a UUID when the application omits
 *     the column, so new rows are always assigned an identity without code changes being
 *     a hard prerequisite.
 *
 * For app_versions:
 *   - A CHECK constraint instead of NOT NULL, because stub rows (is_stub = true) created
 *     during the git-pull Tier-1 scan are legitimately NULL — they are ephemeral
 *     placeholders that get deleted once hydration completes. Stubs with NULL co_relation_id
 *     are allowed; every non-stub row must have one.
 *   - No DEFAULT gen_random_uuid() on app_versions: the pull path passes co_relation_id
 *     explicitly from the imported JSON (the source's co_relation_id becomes the value).
 *     Adding a DEFAULT would silently mask bugs where the import path fails to carry the
 *     value through. Application code is responsible for setting it (Task 3).
 *
 * data_source_options is intentionally excluded (legacy table).
 */
export class AddCoRelationIdNotNullConstraints1777200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── apps ─────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE apps
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── pages ────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE pages
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── components ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE components
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── layouts ──────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE layouts
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── data_sources ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_sources
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── data_queries ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_queries
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── event_handlers ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE event_handlers
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── data_query_folders ───────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_query_folders
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── data_query_folder_mappings ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_query_folder_mappings
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── internal_tables ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE internal_tables
        ALTER COLUMN co_relation_id SET NOT NULL,
        ALTER COLUMN co_relation_id SET DEFAULT gen_random_uuid();
    `);

    // ── app_versions (CHECK constraint, not NOT NULL) ────────────────────────────
    // Allows NULL only when is_stub = true. Any non-stub row must carry a co_relation_id.
    // is_stub defaults to false so NULL is_stub (pre-column legacy rows) is treated as
    // non-stub and also requires co_relation_id — those rows were backfilled in 1777100000000.
    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD CONSTRAINT chk_app_versions_co_relation_id_when_not_stub
        CHECK (is_stub IS NOT DISTINCT FROM true OR co_relation_id IS NOT NULL);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── app_versions ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE app_versions
        DROP CONSTRAINT IF EXISTS chk_app_versions_co_relation_id_when_not_stub;
    `);

    // ── internal_tables ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE internal_tables
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── data_query_folder_mappings ───────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_query_folder_mappings
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── data_query_folders ───────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_query_folders
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── event_handlers ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE event_handlers
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── data_queries ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_queries
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── data_sources ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE data_sources
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── layouts ──────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE layouts
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── components ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE components
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── pages ────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE pages
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);

    // ── apps ─────────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE apps
        ALTER COLUMN co_relation_id DROP NOT NULL,
        ALTER COLUMN co_relation_id DROP DEFAULT;
    `);
  }
}
