import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAutoSyncColumn1768805514611 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_git_sync" ADD COLUMN "auto_sync" boolean NOT NULL DEFAULT false`);
        }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_git_sync" DROP COLUMN "auto_sync"`);
        }
}
