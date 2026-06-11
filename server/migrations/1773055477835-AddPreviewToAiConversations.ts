import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPreviewToAiConversations1773055477835 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ai_conversations ADD COLUMN preview TEXT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ai_conversations DROP COLUMN preview`);
    }

}
