import { MigrationInterface, QueryRunner } from 'typeorm';

// Scans of app versions, their findings, exceptions to findings, and each workspace's scan policy.
// organization_id is on every table so reads can be scoped to a workspace without a join.
export class CreateAppSecurityScans1792460000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_version_scans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
        app_version_id uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
        source varchar(20) NOT NULL CHECK (source IN ('builder', 'dev', 'publish', 'external', 'production')),
        gate varchar(10) NOT NULL CHECK (gate IN ('pass', 'fail')),
        summary jsonb NOT NULL DEFAULT '{}',
        sarif jsonb NOT NULL,
        dependencies jsonb NULL,
        override_reason text NULL,
        overridden_by uuid NULL,
        overridden_at timestamp NULL,
        created_by uuid NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_app_version_scans_version ON app_version_scans (app_version_id, created_at DESC)'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_app_version_scans_org ON app_version_scans (organization_id, created_at DESC)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS scan_findings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_id uuid NOT NULL REFERENCES app_version_scans(id) ON DELETE CASCADE,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        check_id varchar(200) NOT NULL,
        rule_id varchar(300) NOT NULL,
        severity varchar(10) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
        fingerprint varchar(128) NOT NULL,
        tool varchar(200) NOT NULL,
        tool_version varchar(100) NOT NULL,
        message text NOT NULL,
        help text NULL,
        location jsonb NOT NULL DEFAULT '{}',
        properties jsonb NOT NULL DEFAULT '{}',
        status varchar(12) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'exception', 'fixed'))
      )
    `);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_scan_findings_scan ON scan_findings (scan_id)');
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_scan_findings_rule ON scan_findings (organization_id, rule_id, fingerprint)'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS scan_exceptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        app_id uuid NULL REFERENCES apps(id) ON DELETE CASCADE,
        rule_id varchar(300) NOT NULL,
        fingerprint varchar(128) NOT NULL,
        reason text NOT NULL,
        expires_at timestamp NULL,
        created_by uuid NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        revoked_by uuid NULL,
        revoked_at timestamp NULL
      )
    `);
    // One live exception per finding and scope; revoked rows stay as the audit trail.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_scan_exceptions_live
      ON scan_exceptions (organization_id, COALESCE(app_id, '00000000-0000-0000-0000-000000000000'::uuid), rule_id, fingerprint)
      WHERE revoked_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS workspace_scan_policies (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
        policy jsonb NOT NULL DEFAULT '{}',
        updated_by uuid NULL,
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS workspace_scan_policies');
    await queryRunner.query('DROP TABLE IF EXISTS scan_exceptions');
    await queryRunner.query('DROP TABLE IF EXISTS scan_findings');
    await queryRunner.query('DROP TABLE IF EXISTS app_version_scans');
  }
}
