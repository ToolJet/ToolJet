import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetadataColumnInConversationTable1778485042438 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD COLUMN IF NOT EXISTS "metadata" json NULL DEFAULT '{}'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ai_conversations" DROP COLUMN IF EXISTS "metadata"`);
  }
}
