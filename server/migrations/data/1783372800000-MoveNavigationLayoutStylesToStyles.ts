import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'MoveNavigationLayoutStylesToStyles1783372800000';
const BATCH_SIZE = 2000;
const COMPONENT_TYPE = 'Navigation';

// Layout keys moved from `properties` to `styles`, keeping the same value shape ({ value: ... }).
const KEYS_TO_MOVE = ['orientation', 'displayStyle', 'navItemSize', 'horizontalAlignment', 'verticalAlignment'];

export class MoveNavigationLayoutStylesToStyles1783372800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updatedAppVersionIds = new Set<string>();

    // A component needs migrating if it still has any of the legacy layout keys in properties.
    const needsMigrationClause = `
      type = $1
      AND (
        properties::jsonb ?| $2::text[]
      )`;

    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${needsMigrationClause}`, [
      COMPONENT_TYPE,
      KEYS_TO_MOVE,
    ]);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Navigation components to migrate: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE ${needsMigrationClause} AND id > $3
         ORDER BY id ASC
         LIMIT $4`,
        [COMPONENT_TYPE, KEYS_TO_MOVE, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      // Copy each moved key into styles only if absent (never overwrite), then drop it from properties. subMenuAlignment is intentionally not seeded (kept opt-in).
      await queryRunner.query(
        `UPDATE components SET
           styles = (
             COALESCE(styles::jsonb, '{}'::jsonb)
             || CASE WHEN (properties::jsonb ? 'orientation') AND NOT (COALESCE(styles::jsonb,'{}'::jsonb) ? 'orientation')
                  THEN jsonb_build_object('orientation', properties::jsonb->'orientation') ELSE '{}'::jsonb END
             || CASE WHEN (properties::jsonb ? 'displayStyle') AND NOT (COALESCE(styles::jsonb,'{}'::jsonb) ? 'displayStyle')
                  THEN jsonb_build_object('displayStyle', properties::jsonb->'displayStyle') ELSE '{}'::jsonb END
             || CASE WHEN (properties::jsonb ? 'navItemSize') AND NOT (COALESCE(styles::jsonb,'{}'::jsonb) ? 'navItemSize')
                  THEN jsonb_build_object('navItemSize', properties::jsonb->'navItemSize') ELSE '{}'::jsonb END
             || CASE WHEN (properties::jsonb ? 'horizontalAlignment') AND NOT (COALESCE(styles::jsonb,'{}'::jsonb) ? 'horizontalAlignment')
                  THEN jsonb_build_object('horizontalAlignment', properties::jsonb->'horizontalAlignment') ELSE '{}'::jsonb END
             || CASE WHEN (properties::jsonb ? 'verticalAlignment') AND NOT (COALESCE(styles::jsonb,'{}'::jsonb) ? 'verticalAlignment')
                  THEN jsonb_build_object('verticalAlignment', properties::jsonb->'verticalAlignment') ELSE '{}'::jsonb END
           )::json,
           properties = (
             COALESCE(properties::jsonb,'{}'::jsonb)
               - 'orientation' - 'displayStyle' - 'navItemSize' - 'horizontalAlignment' - 'verticalAlignment'
           )::json
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      const batchVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
         FROM components c
         INNER JOIN pages p ON c.page_id = p.id
         WHERE c.id = ANY($1::uuid[])`,
        [ids]
      );
      for (const row of batchVersionRows) {
        if (row.app_version_id) updatedAppVersionIds.add(row.app_version_id);
      }

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Migration finished. Updated: ${totalUpdated}`);

    if (totalUpdated > 0 && updatedAppVersionIds.size > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: Array.from(updatedAppVersionIds) },
        MIGRATION_NAME
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
