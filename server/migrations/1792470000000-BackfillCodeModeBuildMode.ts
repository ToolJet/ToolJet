import { MigrationInterface, QueryRunner } from 'typeorm';

// Sets build_mode 'code' on existing apps that have a component with a codePage property.
export class BackfillCodeModeBuildMode1792470000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE apps SET build_mode = 'code'
      WHERE build_mode = 'visual' AND id IN (
        SELECT v.app_id FROM components c
        JOIN pages p ON p.id = c.page_id
        JOIN app_versions v ON v.id = p.app_version_id
        WHERE c.properties -> 'codePage' ->> 'value' IN ('{{true}}', 'true')
      )
    `);
  }

  public async down(): Promise<void> {
    // Not reversible: a backfilled app can't be told apart from one created with build_mode 'code'.
  }
}
