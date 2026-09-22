import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiAttachments1789689600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_attachments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "name" varchar(255) NOT NULL,
        "type" varchar(255) NOT NULL,
        "size" integer NOT NULL CHECK ("size" BETWEEN 0 AND 10485760),
        "s3_bucket" text NOT NULL,
        "s3_key" text NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'ready', 'failed')),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_ai_attachments_object" UNIQUE ("s3_bucket", "s3_key")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_ai_attachments_owner" ON "ai_attachments" ("organization_id", "user_id")
    `);
    await queryRunner.query(`CREATE INDEX "idx_ai_attachments_user" ON "ai_attachments" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback removes only metadata; uploaded S3 objects are deliberately retained.
    await queryRunner.query('DROP TABLE "ai_attachments"');
  }
}
