import { MigrationInterface, QueryRunner } from 'typeorm';

// Staging only, for testing MIGRATION_MODE. Never merge. Reset: see the staging test plan.
// STAGING_MOCK_SCALE multiplies every wait (default 1: about 30s here).
export class StagingMockCreateWidgets1799999990001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const scale = Number(process.env.STAGING_MOCK_SCALE) || 1;
    await queryRunner.query(
      'CREATE TABLE staging_mock_widgets (id serial PRIMARY KEY, label text NOT NULL, verified boolean NOT NULL DEFAULT false)'
    );
    for (let step = 1; step <= 6; step++) {
      await queryRunner.query('SELECT pg_sleep($1)', [5 * scale]);
      console.log(`StagingMockCreateWidgets1799999990001 Progress ${Math.round((step / 6) * 100)} %`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS staging_mock_widgets');
  }
}
