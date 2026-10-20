import { MigrationInterface, QueryRunner } from 'typeorm';

// Snapshot history is trimmed per app as well as per version; this keeps that trim an index scan.
export class IndexAppVersionSnapshotsByApp1791700000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS app_version_snapshots_app ON app_version_snapshots (app_id, reason, created_at DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS app_version_snapshots_app`);
  }
}
