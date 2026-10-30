import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds an enum value and uses it in the same schema migration: 55P04 unless the value was committed first. */
export class AddAndUseFixtureColor1790700000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE fixture_color ADD VALUE IF NOT EXISTS 'blue'`);
    await queryRunner.query(`SELECT 'blue'::fixture_color`);
  }

  public async down(): Promise<void> {
    // Enum values cannot be removed.
  }
}
