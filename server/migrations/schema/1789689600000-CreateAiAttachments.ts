import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiAttachments1789689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_attachments" (
        "id" uuid PRIMARY KEY,
        "organization_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "conversation_id" uuid REFERENCES "ai_conversations"("id") ON DELETE SET NULL,
        "name" varchar(255) NOT NULL,
        "mime_type" varchar(255) NOT NULL,
        "size" integer NOT NULL CHECK ("size" BETWEEN 0 AND 10485760),
        "sha256" varchar(64) NOT NULL CHECK ("sha256" ~ '^[0-9a-f]{64}$'),
        "state" varchar(16) NOT NULL DEFAULT 'draft' CHECK ("state" IN ('draft', 'attached')),
        "expires_at" timestamptz NOT NULL,
        "attached_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_ai_attachments_owner" ON "ai_attachments" ("organization_id", "user_id")
    `);
    await queryRunner.query(`CREATE INDEX "idx_ai_attachments_user" ON "ai_attachments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_ai_attachments_conversation" ON "ai_attachments" ("conversation_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "ai_attachments"');
  }
}
