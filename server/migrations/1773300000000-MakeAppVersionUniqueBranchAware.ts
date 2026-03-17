import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAppVersionUniqueBranchAware1773300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old unique constraint (name, app_id)
    await queryRunner.query(`
      ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS name_app_id_app_versions_unique;
    `);

    // Create new branch-aware unique constraint (name, app_id, branch_id)
    // This allows the same version name (e.g. 'v1') to exist on different branches
    // for the same app, while still preventing duplicates within a branch.
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_app_versions_name_app_branch
      ON app_versions (name, app_id, COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_app_versions_name_app_branch;
    `);

    await queryRunner.query(`
      ALTER TABLE app_versions ADD CONSTRAINT name_app_id_app_versions_unique UNIQUE (name, app_id);
    `);
  }
}
