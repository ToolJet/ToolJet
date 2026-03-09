import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastOpenedAtToAiConversations1773043473003 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ai_conversations ADD COLUMN last_opened_at TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ai_conversations DROP COLUMN last_opened_at`);
    }

}
