import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranchingAndSchemaVersionToOrgGitSync1761828716101 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isBranchingEnabled column to organization_git_sync table
        await queryRunner.query(
            `ALTER TABLE "organization_git_sync" 
            ADD COLUMN IF NOT EXISTS "is_branching_enabled" boolean NOT NULL DEFAULT true`
        );
        // default value is set to true for now, this migration should be changed before releasing for lts and default should be false.

        // Add schema_version column to organization_git_sync table
        await queryRunner.query(
            `ALTER TABLE "organization_git_sync" 
            ADD COLUMN IF NOT EXISTS "schema_version" varchar NOT NULL DEFAULT '1.0.0'`
        );

    }
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "organization_git_sync" DROP COLUMN IF EXISTS "is_branching_enabled"`
        );

        await queryRunner.query(
            `ALTER TABLE "organization_git_sync" DROP COLUMN IF EXISTS "schema_version"`
        );
    }
}
