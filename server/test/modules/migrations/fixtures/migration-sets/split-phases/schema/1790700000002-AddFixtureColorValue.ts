import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds an enum value that the data migration uses. The type exists only when the spec created it first. */
export class AddFixtureColorValue1790700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN CREATE TYPE fixture_color AS ENUM ('red'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`
    );
    await queryRunner.query(`ALTER TYPE fixture_color ADD VALUE IF NOT EXISTS 'blue'`);
  }

  public async down(): Promise<void> {
    // Enum values cannot be removed.
  }
}
