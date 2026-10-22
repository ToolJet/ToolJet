import { MigrationInterface, QueryRunner } from 'typeorm';

// Staging only, for testing MIGRATION_MODE. Never merge. About 45s at STAGING_MOCK_SCALE=1.
// Fails halfway while the table staging_mock_fail exists (CREATE it to test failure, DROP it to retry).
export class StagingMockVerifyWidgets1799999990003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const scale = Number(process.env.STAGING_MOCK_SCALE) || 1;
    const [{ fail }] = await queryRunner.query(`SELECT to_regclass('public.staging_mock_fail') IS NOT NULL AS fail`);
    const total = 10000;
    console.log(`StagingMockVerifyWidgets: [START] Verifying widgets: ${total}`);
    for (let done = 2000; done <= total; done += 2000) {
      await queryRunner.query('SELECT pg_sleep($1)', [9 * scale]);
      if (fail && done === 6000) {
        throw new Error('StagingMockVerifyWidgets: staging_mock_fail exists, failing on purpose');
      }
      await queryRunner.query('UPDATE staging_mock_widgets SET verified = true WHERE id <= $1', [done]);
      console.log(`StagingMockVerifyWidgets: [PROGRESS] ${done}/${total} (${Math.round((done / total) * 100)}%)`);
    }
    console.log('StagingMockVerifyWidgets: [SUCCESS] Verifying widgets finished.');
  }

  public async down(): Promise<void> {
    // Staging mock: dropping staging_mock_widgets in the schema mock undoes it.
  }
}
