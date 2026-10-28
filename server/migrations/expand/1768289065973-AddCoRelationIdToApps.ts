import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoRelationIdToApps1768289065973 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS "co_relation_id" uuid DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE apps DROP COLUMN IF EXISTS "co_relation_id"`);
    }

}
