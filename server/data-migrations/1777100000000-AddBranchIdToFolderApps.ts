import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBranchIdToFolderApps1777100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add nullable branch_id — PostgreSQL 11+ makes this instant (catalog-only change)
    await queryRunner.addColumn(
      'folder_apps',
      new TableColumn({
        name: 'branch_id',
        type: 'uuid',
        isNullable: true,
        default: null,
      })
    );

    // Step 2: Replace uniq_folder_apps_app_id (global, app_id only) with two partial indexes.
    // The old index was created via CREATE UNIQUE INDEX by data-migration 1769151383974,
    // so DROP INDEX is required — ALTER TABLE DROP CONSTRAINT does nothing here.
    // Two partial indexes instead of one composite: PostgreSQL treats NULL != NULL in unique
    // checks, so UNIQUE (app_id, branch_id) would allow duplicate NULL-branch rows.
    await queryRunner.query(`DROP INDEX IF EXISTS uniq_folder_apps_app_id`);
    // one folder per app per branch (git orgs)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_folder_apps_app_branch
        ON folder_apps (app_id, branch_id)
        WHERE branch_id IS NOT NULL
    `);
    // one folder per app for non-git orgs and workflows (branch_id always NULL)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_folder_apps_app_no_branch
        ON folder_apps (app_id)
        WHERE branch_id IS NULL
    `);

    // Step 3: Add FK with NOT VALID — skips the full table scan that a plain ADD FOREIGN KEY
    // would do (ACCESS EXCLUSIVE + row scan on millions of rows). The data migration in Steps
    // 4-5 will leave only valid branch_id values, so we validate after those steps.
    await queryRunner.query(`
      ALTER TABLE folder_apps
        ADD CONSTRAINT fk_folder_apps_branch_id
        FOREIGN KEY (branch_id)
        REFERENCES organization_git_sync_branches(id)
        ON DELETE CASCADE
        NOT VALID
    `);

    // Step 4: Materialise branch-scoped rows for git orgs using app_versions as source of truth.
    // Only create a row if the app actually has a version on that branch — never assume
    // main and feature have identical app sets.
    // Workflows are excluded — they are not git-synced and must always use branch_id = NULL.
    // The JOIN to organization_git_sync_branches already limits to git orgs — no extra EXISTS needed.
    await queryRunner.query(`
      INSERT INTO folder_apps (folder_id, app_id, branch_id, created_at, updated_at)
      SELECT fa.folder_id, fa.app_id, wb.id, now(), now()
      FROM folder_apps fa
      JOIN folders f ON f.id = fa.folder_id
      JOIN organization_git_sync_branches wb ON wb.organization_id = f.organization_id
      JOIN app_versions av ON av.app_id = fa.app_id AND av.branch_id = wb.id
      WHERE fa.branch_id IS NULL
        AND fa.app_id NOT IN (SELECT id FROM apps WHERE type = 'workflow')
      ON CONFLICT DO NOTHING
    `);

    // Step 5: Delete the now-replaced branchless rows for git orgs.
    // Workflows are excluded — not git-synced, never get branch-scoped rows in Step 4,
    // and must keep their branch_id = NULL rows as their only records.
    // Guard on organization_git_sync_branches so we only delete when actual branches exist.
    await queryRunner.query(`
      DELETE FROM folder_apps fa
      USING folders f
      WHERE fa.folder_id = f.id
        AND fa.branch_id IS NULL
        AND fa.app_id NOT IN (SELECT id FROM apps WHERE type = 'workflow')
        AND EXISTS (
          SELECT 1 FROM organization_git_sync_branches
          WHERE organization_id = f.organization_id
        )
    `);

    // Step 6: Validate FK — takes SHARE UPDATE EXCLUSIVE (allows concurrent reads/writes)
    // instead of ACCESS EXCLUSIVE. Safe to run after data migration since all branch_ids are valid.
    await queryRunner.query(`ALTER TABLE folder_apps VALIDATE CONSTRAINT fk_folder_apps_branch_id`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-insert one branchless row per (folder, app) from the branch-scoped rows
    await queryRunner.query(`
      INSERT INTO folder_apps (folder_id, app_id, created_at, updated_at)
      SELECT DISTINCT ON (folder_id, app_id) folder_id, app_id, created_at, updated_at
      FROM folder_apps
      WHERE branch_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    // Drop FK by name, then indexes (must precede dropColumn — they reference branch_id), then column
    await queryRunner.query(`ALTER TABLE folder_apps DROP CONSTRAINT IF EXISTS fk_folder_apps_branch_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS uniq_folder_apps_app_branch`);
    await queryRunner.query(`DROP INDEX IF EXISTS uniq_folder_apps_app_no_branch`);
    await queryRunner.dropColumn('folder_apps', 'branch_id');

    // Restore original index (was a CREATE UNIQUE INDEX, not a table constraint)
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_folder_apps_app_id ON folder_apps (app_id)`);
  }
}
