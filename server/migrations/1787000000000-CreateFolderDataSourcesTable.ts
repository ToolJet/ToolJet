import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * folder_data_sources — join table organising (global) data sources into folders,
 * the data-source analogue of folder_apps.
 *
 * Unlike folder_apps (which pre-dated the branch model and had to retrofit a nullable
 * branch_id, then backfill and enforce NOT NULL across three migrations), this table is
 * created fresh AFTER every org already has a default branch. So branch_id is NOT NULL
 * from the start and there is nothing to backfill.
 *
 * Grain: folder membership is a property of (data_source, branch), never of a specific
 * data_source_version. The data_sources row is shared identity across branches (co_relation_id);
 * only its version carries a branch. Because data_source_versions is UNIQUE (data_source_id,
 * branch_id) — exactly one version row per data source per branch — keying this table on
 * (data_source_id, branch_id) is equivalent to keying on data_source_version_id, but stays
 * stable across the version-row churn that git pull/reconcile causes.
 *
 * uniq_folder_data_sources_ds_branch enforces one folder per data source per branch. Because
 * branch_id is NOT NULL there is no NULL-branch partial-index split (the NULL != NULL trap that
 * forced folder_apps to carry two partial indexes does not apply here).
 */
export class CreateFolderDataSourcesTable1787000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS folder_data_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        folder_id UUID NOT NULL,
        data_source_id UUID NOT NULL,
        branch_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

        CONSTRAINT fk_folder_data_sources_folder
          FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
        CONSTRAINT fk_folder_data_sources_data_source
          FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE,
        CONSTRAINT fk_folder_data_sources_branch
          FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE CASCADE
      )
    `);

    // One folder per data source per branch. A data source can sit in different folders on
    // different branches (one row each), but never in two folders on the same branch.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_folder_data_sources_ds_branch
        ON folder_data_sources (data_source_id, branch_id)
    `);

    // Read path lists a folder's contents scoped to a branch — support (folder_id, branch_id) lookups.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_folder_data_sources_folder_branch
        ON folder_data_sources (folder_id, branch_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS folder_data_sources`);
  }
}
