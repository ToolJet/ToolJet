import { MigrationInterface, QueryRunner } from 'typeorm';

// apps.build_mode: 'visual' (default) or 'code'. Existing apps are visual.
export class AddAppBuildMode1792450000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE apps ADD COLUMN IF NOT EXISTS build_mode varchar(16) NOT NULL DEFAULT 'visual'`);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE apps ADD CONSTRAINT apps_build_mode_check CHECK (build_mode IN ('visual', 'code'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE apps DROP CONSTRAINT IF EXISTS apps_build_mode_check');
    await queryRunner.query('ALTER TABLE apps DROP COLUMN IF EXISTS build_mode');
  }
}
