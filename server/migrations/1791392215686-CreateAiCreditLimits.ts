import { MigrationInterface, QueryRunner } from 'typeorm';

// No FKs, like the credit history: limits are keyed by scope and user ids only.
// organization_id NULL = self-hosted instance; user_id NULL = scope default. No rows = limits on.
// seen_plan, seen_ends_at, notice: default rows only. Last seen pool size, add-on expiry (NULL once expired), pool-change notice.
export class CreateAiCreditLimits1791392215686 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_credit_limits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid,
        user_id uuid,
        pool varchar(16) NOT NULL CHECK (pool IN ('monthly', 'addon')),
        mode varchar(16) NOT NULL CHECK (mode IN ('equal_share', 'custom')),
        value integer CHECK (value >= 1),
        enabled boolean NOT NULL DEFAULT false,
        seen_plan integer,
        seen_ends_at timestamptz,
        notice jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CHECK ((mode = 'custom') = (value IS NOT NULL))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ai_credit_limits_scope_user_pool ON ai_credit_limits (
        COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
        pool
      );
    `);

    // Existing scopes keep today's state (off). Default rows come in pairs, so ON CONFLICT skips configured scopes.
    await queryRunner.query(`
      INSERT INTO ai_credit_limits (organization_id, user_id, pool, mode, value, enabled)
      SELECT scope.id, NULL, pool.name, 'equal_share', NULL, false
        FROM (SELECT id FROM organizations
              UNION ALL
              SELECT NULL::uuid WHERE EXISTS (SELECT 1 FROM organizations)) scope
       CROSS JOIN (VALUES ('monthly'), ('addon')) pool(name)
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ai_credit_limits`);
  }
}
