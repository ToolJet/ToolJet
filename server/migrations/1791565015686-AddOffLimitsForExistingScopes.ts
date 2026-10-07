import { MigrationInterface, QueryRunner } from 'typeorm';

// No default rows now means limits on (new workspaces start on). Every scope that already exists keeps today's
// state: write its default rows off, equal share. One pair per workspace (Cloud scope) and, once any workspace
// exists, one for the instance (self-hosted scope). Fresh install: no workspaces yet, no rows. Default rows
// are always written in pairs, so ON CONFLICT leaves a configured scope alone. Data only, so down is a no-op:
// off rows read as off either way.
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
