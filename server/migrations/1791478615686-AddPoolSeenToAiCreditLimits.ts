import { MigrationInterface, QueryRunner } from 'typeorm';

// Default rows only (user_id NULL): the pool plan size last seen, the add-on expiry last seen (it goes NULL once
// the add-on expires) and the latest pool-change notice. Plain nullable ADD COLUMN: no rewrite.
export class AddPoolSeenToAiCreditLimits1791478615686 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await withLockTimeout(
      queryRunner,
      `ALTER TABLE ai_credit_limits
        ADD COLUMN IF NOT EXISTS seen_plan integer,
        ADD COLUMN IF NOT EXISTS seen_ends_at timestamptz,
        ADD COLUMN IF NOT EXISTS notice jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await withLockTimeout(
      queryRunner,
      `ALTER TABLE ai_credit_limits
        DROP COLUMN IF EXISTS seen_plan,
        DROP COLUMN IF EXISTS seen_ends_at,
        DROP COLUMN IF EXISTS notice`
    );
  }
}

// Every migration of a deploy shares one transaction: give up on the table lock after 5s, then put the
// previous lock_timeout back so later migrations don't inherit it.
async function withLockTimeout(queryRunner: QueryRunner, sql: string): Promise<void> {
  const [{ lock_timeout: previous }] = await queryRunner.query('SHOW lock_timeout');
  await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
  await queryRunner.query(sql);
  await queryRunner.query(`SELECT set_config('lock_timeout', $1, true)`, [previous]);
}
