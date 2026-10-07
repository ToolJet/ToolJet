import { MigrationInterface, QueryRunner } from 'typeorm';

// Existing scopes keep today's state (off); no rows now means on. Default rows come in pairs, so ON CONFLICT skips configured scopes.
export class AddOffLimitsForExistingScopes1791565015686 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await withLockTimeout(
      queryRunner,
      `INSERT INTO ai_credit_limits (organization_id, user_id, pool, mode, value, enabled)
       SELECT scope.id, NULL, pool.name, 'equal_share', NULL, false
         FROM (SELECT id FROM organizations
               UNION ALL
               SELECT NULL::uuid WHERE EXISTS (SELECT 1 FROM organizations)) scope
        CROSS JOIN (VALUES ('monthly'), ('addon')) pool(name)
       ON CONFLICT DO NOTHING`
    );
  }

  public async down(): Promise<void> {}
}

// Every migration of a deploy shares one transaction: give up on the table lock after 5s, then put the
// previous lock_timeout back so later migrations don't inherit it.
async function withLockTimeout(queryRunner: QueryRunner, sql: string): Promise<void> {
  const [{ lock_timeout: previous }] = await queryRunner.query('SHOW lock_timeout');
  await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
  await queryRunner.query(sql);
  await queryRunner.query(`SELECT set_config('lock_timeout', $1, true)`, [previous]);
}
