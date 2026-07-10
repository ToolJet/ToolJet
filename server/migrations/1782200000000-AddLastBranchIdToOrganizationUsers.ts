import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Persist each user's last-used Git branch per workspace so login can restore it (instead of
 * always landing on the default branch). Nullable — most users/workspaces never switch off the
 * default branch. FK to organization_git_sync_branches with ON DELETE SET NULL so deleting a
 * branch clears any stale reference automatically.
 */
export class AddLastBranchIdToOrganizationUsers1782200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization_users" ADD COLUMN IF NOT EXISTS "last_branch_id" uuid`);
    await queryRunner.query(`
      ALTER TABLE "organization_users"
      ADD CONSTRAINT "FK_organization_users_last_branch_id"
      FOREIGN KEY ("last_branch_id") REFERENCES "organization_git_sync_branches"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_users" DROP CONSTRAINT IF EXISTS "FK_organization_users_last_branch_id"`
    );
    await queryRunner.query(`ALTER TABLE "organization_users" DROP COLUMN IF EXISTS "last_branch_id"`);
  }
}
