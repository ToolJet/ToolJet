import { MigrationInterface, QueryRunner } from 'typeorm';

// Default rows only (user_id NULL): the pool plan size last seen, the add-on expiry last seen (it goes NULL once
// the add-on expires) and the latest pool-change notice. Plain nullable ADD COLUMN: no rewrite.
export class AddPoolSeenToAiCreditLimits1791478615686 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      SET LOCAL lock_timeout = '5s';
      ALTER TABLE ai_credit_limits
        ADD COLUMN IF NOT EXISTS seen_plan integer,
        ADD COLUMN IF NOT EXISTS seen_ends_at timestamptz,
        ADD COLUMN IF NOT EXISTS notice jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE ai_credit_limits
        DROP COLUMN IF EXISTS seen_plan,
        DROP COLUMN IF EXISTS seen_ends_at,
        DROP COLUMN IF EXISTS notice;
    `);
  }
}
