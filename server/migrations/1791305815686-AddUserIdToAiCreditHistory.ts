import { MigrationInterface, QueryRunner } from 'typeorm';

// No FK: billing history outlives users. No spend index yet: usage reads use the existing owner-id index.
// TODO: add (owner, created_at) spend indexes once history grows; CONCURRENTLY can't run in this transaction.
export class AddUserIdToAiCreditHistory1791305815686 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fail the deploy rather than queue every AI charge behind a long read on these tables.
    await withLockTimeout(
      queryRunner,
      `ALTER TABLE organization_ai_credit_history ADD COLUMN IF NOT EXISTS user_id uuid;
      ALTER TABLE selfhost_customers_ai_credit_history
        ADD COLUMN IF NOT EXISTS user_id uuid,
        ADD COLUMN IF NOT EXISTS organization_id uuid;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await withLockTimeout(
      queryRunner,
      `ALTER TABLE organization_ai_credit_history DROP COLUMN IF EXISTS user_id;
      ALTER TABLE selfhost_customers_ai_credit_history
        DROP COLUMN IF EXISTS user_id,
        DROP COLUMN IF EXISTS organization_id;`
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
