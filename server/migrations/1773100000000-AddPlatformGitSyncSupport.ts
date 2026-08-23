import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformGitSyncSupport1773100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add branch-level tracking columns to app_versions (branch_id + is_stub),
    //    plus pulled_at for git-sync pull tracking.
    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS is_stub BOOLEAN NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS branch_id UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS pulled_at TIMESTAMP DEFAULT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD CONSTRAINT fk_app_versions_branch
        FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE SET NULL;
    `);

    // 2. Relax app name uniqueness for GIT-created apps.
    //    See data-migration 1773100000001 — runs after older data-migrations
    //    that create/modify the app_name_organization_id_unique constraint.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS fk_app_versions_branch;`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS pulled_at;`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS is_stub;`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS branch_id;`);
  }
}
