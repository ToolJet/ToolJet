import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsGitBranchOrgGitSync1761828800000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add is_git_branch column to organization_git_sync table
        await queryRunner.query(
            `ALTER TABLE "organization_git_sync" 
            ADD COLUMN IF NOT EXISTS "is_git_branch" boolean NOT NULL DEFAULT false`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "organization_git_sync" DROP COLUMN IF EXISTS "is_git_branch"`
        );
    }
}
