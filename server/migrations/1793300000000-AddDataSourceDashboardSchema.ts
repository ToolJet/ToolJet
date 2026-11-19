// migration-lint: allow-destructive the new foreign keys and unique constraint are on new, empty
// columns; the replaced pinned_items check only widens it to a third column, so every existing row passes.
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataSourceDashboardSchema1793300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS created_by uuid`);
    await queryRunner.query(`
      ALTER TABLE data_sources
      ADD CONSTRAINT fk_data_sources_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_data_source_activity (
        user_id UUID NOT NULL,
        data_source_id UUID NOT NULL,
        branch_id UUID NOT NULL,
        last_viewed_at TIMESTAMP NULL,
        last_edited_at TIMESTAMP NULL,

        PRIMARY KEY (user_id, data_source_id, branch_id),
        CONSTRAINT fk_user_data_source_activity_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_data_source_activity_data_source
          FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_data_source_activity_branch
          FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_data_source_activity_data_source_branch_edited
        ON user_data_source_activity (data_source_id, branch_id, last_edited_at)
    `);

    await queryRunner.query(`ALTER TABLE pinned_items ADD COLUMN IF NOT EXISTS data_source_id uuid`);
    await queryRunner.query(`
      ALTER TABLE pinned_items
      ADD CONSTRAINT fk_pinned_items_data_source FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`ALTER TABLE pinned_items DROP CONSTRAINT IF EXISTS chk_pinned_items_one_resource`);
    await queryRunner.query(`
      ALTER TABLE pinned_items
      ADD CONSTRAINT chk_pinned_items_one_resource CHECK (num_nonnulls(app_id, folder_id, data_source_id) = 1)
    `);
    await queryRunner.query(`
      ALTER TABLE pinned_items
      ADD CONSTRAINT uq_pinned_items_user_branch_data_source UNIQUE (user_id, branch_id, data_source_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pinned_items DROP CONSTRAINT IF EXISTS uq_pinned_items_user_branch_data_source
    `);
    // The two-column CHECK rejects a surviving data_source_id pin, so the rows have to go first.
    await queryRunner.query(`DELETE FROM pinned_items WHERE data_source_id IS NOT NULL`);
    await queryRunner.query(`ALTER TABLE pinned_items DROP CONSTRAINT IF EXISTS chk_pinned_items_one_resource`);
    await queryRunner.query(`
      ALTER TABLE pinned_items
      ADD CONSTRAINT chk_pinned_items_one_resource CHECK (num_nonnulls(app_id, folder_id) = 1)
    `);
    await queryRunner.query(`ALTER TABLE pinned_items DROP CONSTRAINT IF EXISTS fk_pinned_items_data_source`);
    await queryRunner.query(`ALTER TABLE pinned_items DROP COLUMN IF EXISTS data_source_id`);

    await queryRunner.query(`DROP TABLE IF EXISTS user_data_source_activity`);

    await queryRunner.query(`ALTER TABLE data_sources DROP CONSTRAINT IF EXISTS fk_data_sources_created_by`);
    await queryRunner.query(`ALTER TABLE data_sources DROP COLUMN IF EXISTS created_by`);
  }
}
