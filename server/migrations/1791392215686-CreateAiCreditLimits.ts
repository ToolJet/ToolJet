import { MigrationInterface, QueryRunner } from 'typeorm';

// No FKs, like the credit history: limits are keyed by scope and user ids only.
// organization_id NULL = self-hosted instance; user_id NULL = scope default. No rows = limits off.
export class CreateAiCreditLimits1791392215686 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await withLockTimeout(
      queryRunner,
      `CREATE TABLE IF NOT EXISTS ai_credit_limits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid,
        user_id uuid,
        pool varchar(16) NOT NULL CHECK (pool IN ('monthly', 'addon')),
        mode varchar(16) NOT NULL CHECK (mode IN ('equal_share', 'custom')),
        value integer CHECK (value >= 1),
        enabled boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CHECK ((mode = 'custom') = (value IS NOT NULL))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ai_credit_limits_scope_user_pool ON ai_credit_limits (
        COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
        pool
      );`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await withLockTimeout(queryRunner, `DROP TABLE IF EXISTS ai_credit_limits;`);
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
