import { MigrationInterface, QueryRunner } from 'typeorm';

// Staging only, for testing MIGRATION_MODE. Never merge. About 90s at STAGING_MOCK_SCALE=1.
export class StagingMockBackfillWidgets1799999990002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const scale = Number(process.env.STAGING_MOCK_SCALE) || 1;
    const batches = 10;
    const total = batches * 1000;
    console.log(`StagingMockBackfillWidgets: [START] Backfilling widgets: ${total}`);
    for (let batch = 1; batch <= batches; batch++) {
      await queryRunner.query(
        `INSERT INTO staging_mock_widgets (label) SELECT 'widget ' || g FROM generate_series($1::int, $2::int) g`,
        [(batch - 1) * 1000 + 1, batch * 1000]
      );
      await queryRunner.query('SELECT pg_sleep($1)', [9 * scale]);
      const done = batch * 1000;
      console.log(`StagingMockBackfillWidgets: [PROGRESS] ${done}/${total} (${Math.round((done / total) * 100)}%)`);
    }
    console.log('StagingMockBackfillWidgets: [SUCCESS] Backfilling widgets finished.');
  }

  public async down(): Promise<void> {}
}
