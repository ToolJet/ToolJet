import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformGitSyncSupport1773100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create app_branch_state table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_branch_state (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        branch_id UUID NOT NULL,
        app_id UUID,
        co_relation_id UUID NOT NULL,
        app_name VARCHAR NOT NULL,
        meta_timestamp NUMERIC(15),
        pulled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),

        CONSTRAINT fk_app_branch_state_organization
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_app_branch_state_branch
          FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE CASCADE,
        CONSTRAINT fk_app_branch_state_app
          FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE SET NULL,

        CONSTRAINT uq_app_branch_state_org_branch_corel
          UNIQUE (organization_id, branch_id, co_relation_id)
      );
    `);

    // 2. Add is_stub column to apps
    await queryRunner.query(`
      ALTER TABLE apps ADD COLUMN IF NOT EXISTS is_stub BOOLEAN NOT NULL DEFAULT false;
    `);

    // 3. Add branch_id column to app_versions (structural FK to workspace branches)
    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS branch_id UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE app_versions
        ADD CONSTRAINT fk_app_versions_branch
        FOREIGN KEY (branch_id) REFERENCES organization_git_sync_branches(id) ON DELETE SET NULL;
    `);

    // 4. Relax app name uniqueness for GIT-created apps.
    //    See data-migration 1773100000001 — runs after older data-migrations
    //    that create/modify the app_name_organization_id_unique constraint.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS fk_app_versions_branch;`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS branch_id;`);
    await queryRunner.query(`ALTER TABLE apps DROP COLUMN IF EXISTS is_stub;`);
    await queryRunner.query(`DROP TABLE IF EXISTS app_branch_state;`);
  }
}
