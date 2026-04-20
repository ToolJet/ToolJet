import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAppBranchStateTable1773200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add pulled_at column to app_versions for git sync tracking
    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS pulled_at TIMESTAMP DEFAULT NULL;
    `);

    // 2. Migrate pulled_at data from app_branch_state into app_versions (if table still exists)
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'app_branch_state') AS exists;
    `);
    if (tableExists[0]?.exists) {
      await queryRunner.query(`
        UPDATE app_versions av
        SET pulled_at = abs.pulled_at
        FROM app_branch_state abs
        WHERE av.app_id = abs.app_id
          AND av.branch_id = abs.branch_id;
      `);
    }

    // 3. Drop the app_branch_state table
    await queryRunner.query(`DROP TABLE IF EXISTS app_branch_state;`);

    // 4. Drop app_meta_timestamp if it exists (redundant — updatedAt is read fresh from appMeta.json)
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS app_meta_timestamp;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Recreate app_branch_state table
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
          FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,

        CONSTRAINT uq_app_branch_state_org_branch_corel
          UNIQUE (organization_id, branch_id, co_relation_id)
      );
    `);

    // 2. Migrate data back from app_versions into app_branch_state
    await queryRunner.query(`
      INSERT INTO app_branch_state (organization_id, branch_id, app_id, co_relation_id, app_name, pulled_at)
      SELECT a.organization_id, av.branch_id, av.app_id, COALESCE(a.co_relation_id, a.id), a.name, av.pulled_at
      FROM app_versions av
      INNER JOIN apps a ON a.id = av.app_id
      WHERE av.branch_id IS NOT NULL
        AND av.pulled_at IS NOT NULL
      ON CONFLICT (organization_id, branch_id, co_relation_id) DO NOTHING;
    `);

    // 3. Drop the pulled_at column from app_versions
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS pulled_at;`);
  }
}
