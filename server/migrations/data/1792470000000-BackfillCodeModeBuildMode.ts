import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'BackfillCodeModeBuildMode1792470000000';
const BATCH_SIZE = 2000;

/**
 * Sets build_mode 'code' on existing apps that have a component with a codePage property, then validates the
 * apps_build_mode_check that AddAppBuildMode1792450000000 added NOT VALID. VALIDATE CONSTRAINT blocks neither reads
 * nor writes.
 */
export class BackfillCodeModeBuildMode1792470000000 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const apps: Array<{ id: string }> = await queryRunner.query(`
      SELECT DISTINCT v.app_id AS id
        FROM components c
        JOIN pages p ON p.id = c.page_id
        JOIN app_versions v ON v.id = p.app_version_id
        JOIN apps a ON a.id = v.app_id
       WHERE a.build_mode = 'visual'
         AND c.properties -> 'codePage' ->> 'value' IN ('{{true}}', 'true')
       ORDER BY 1
    `);
    const total = apps.length;
    console.log(`${MIGRATION_NAME}: [START] Set build mode to code for apps with a code page: ${total}`);

    let done = 0;
    for (let start = 0; start < total; start += BATCH_SIZE) {
      const ids = apps.slice(start, start + BATCH_SIZE).map(({ id }) => id);
      await queryRunner.query(
        `UPDATE apps SET build_mode = 'code' WHERE build_mode = 'visual' AND id = ANY($1::uuid[])`,
        [ids]
      );
      done += ids.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${((done / total) * 100).toFixed(1)}%)`);
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Set build mode to code finished. Updated: ${done}`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE apps VALIDATE CONSTRAINT apps_build_mode_check');
  }

  public async down(): Promise<void> {
    // Not reversible: a backfilled app can't be told apart from one created with build_mode 'code'. A valid check
    // stays valid.
  }
}
