import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAutoCommitColumnToOrgGitTable1708320592518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_git_sync" ADD COLUMN IF NOT EXISTS "auto_commit" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
