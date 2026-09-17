import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureDefaultBranchForAllOrganizations1781740800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure every organization has a default branch.
    // Iterate through all organizations and, for any org that does not already
    // have an is_default = true branch in organization_git_sync_branches,
    // create one named 'main'.
    await queryRunner.query(`
      INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
      SELECT o.id, 'main', true
      FROM organizations o
      WHERE NOT EXISTS (
        SELECT 1
        FROM organization_git_sync_branches b
        WHERE b.organization_id = o.id
          AND b.is_default = true
      )
      ON CONFLICT (organization_id, branch_name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the default 'main' branches created by this migration.
    await queryRunner.query(`
      DELETE FROM organization_git_sync_branches
      WHERE branch_name = 'main'
        AND is_default = true;
    `);
  }
}
