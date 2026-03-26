import { MigrationInterface, QueryRunner } from "typeorm";

export class DropEnvGitProviderColumn1774511622244 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_git_sync" DROP COLUMN IF EXISTS "env_git_provider"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_git_sync" ADD COLUMN "env_git_provider" character varying`);
    }
}
