import { MigrationInterface, QueryRunner } from 'typeorm';

// Point-in-time copies of a version's content, taken before an AI turn edits
// it in place, so the turn can be compared (and later undone) afterwards.
export class CreateAppVersionSnapshots1791700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_version_snapshots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL,
        app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
        version_id uuid NOT NULL REFERENCES app_versions(id) ON DELETE CASCADE,
        reason varchar(30) NOT NULL,
        ref_id varchar(64) NULL,
        fingerprint varchar(80) NOT NULL,
        content jsonb NOT NULL,
        created_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS app_version_snapshots_version ON app_version_snapshots (version_id, created_at DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS app_version_snapshots');
  }
}
