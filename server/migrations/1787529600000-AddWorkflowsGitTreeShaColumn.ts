import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the workflows/ counterpart to the existing per-category git tree SHA tokens
 * (apps_git_tree_sha / modules_git_tree_sha / data_sources_git_tree_sha): equal tree
 * SHA ⇒ the whole workflows category is skipped on pull. See
 * 1782600000000-AddGitTreeShaColumns for the mechanism.
 */
export class AddWorkflowsGitTreeShaColumn1787529600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE organization_git_sync_branches ADD COLUMN IF NOT EXISTS workflows_git_tree_sha VARCHAR(64) DEFAULT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE organization_git_sync_branches DROP COLUMN IF EXISTS workflows_git_tree_sha`);
  }
}
