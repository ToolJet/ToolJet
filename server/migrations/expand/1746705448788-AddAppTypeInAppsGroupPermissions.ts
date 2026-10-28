import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppTypeInAppsGroupPermissions1746705448788 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_type') THEN
                CREATE TYPE "app_type" AS ENUM ('front-end', 'workflow');
                END IF;
            END
            $$;
            ALTER TABLE "apps_group_permissions"
            ADD COLUMN "app_type" "app_type" NOT NULL DEFAULT 'front-end';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "apps_group_permissions"
            DROP COLUMN "app_type";
            DROP TYPE IF EXISTS "app_type";
        `);
  }
}
