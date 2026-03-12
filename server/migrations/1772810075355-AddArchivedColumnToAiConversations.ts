import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArchivedColumnToAiConversations1772810075355 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ai_conversations ADD COLUMN archived boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ai_conversations DROP COLUMN archived`);
    }

}
