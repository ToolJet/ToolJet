import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToWorkspaceBranch1773300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_git_sync_branches
      ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_git_sync_branches
      DROP COLUMN IF EXISTS created_by;
    `);
  }
}
