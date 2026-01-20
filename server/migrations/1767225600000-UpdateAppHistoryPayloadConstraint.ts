import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAppHistoryPayloadConstraint1767225600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old check constraint that requires deltas to be arrays
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'app_history'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%jsonb_typeof%';

        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE app_history DROP CONSTRAINT ' || quote_ident(constraint_name);
        END IF;
      END $$;
    `);

    // Clear all existing data - old architecture data is incompatible with new format
    // Previously: delta used array format, now: both snapshot and delta use object format
    await queryRunner.query(`TRUNCATE app_history CASCADE`);

    // Add new simplified constraint - both snapshot and delta are objects
    await queryRunner.query(`
      ALTER TABLE app_history ADD CONSTRAINT check_history_payload_type
      CHECK (jsonb_typeof(change_payload) = 'object')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original constraint
    await queryRunner.query(`
      ALTER TABLE app_history DROP CONSTRAINT IF EXISTS check_history_payload_type
    `);

    await queryRunner.query(`
      ALTER TABLE app_history ADD CONSTRAINT check_history_payload_type CHECK (
        (history_type = 'snapshot' AND jsonb_typeof(change_payload) = 'object') OR
        (history_type = 'delta' AND jsonb_typeof(change_payload) = 'array')
      )
    `);
  }
}
