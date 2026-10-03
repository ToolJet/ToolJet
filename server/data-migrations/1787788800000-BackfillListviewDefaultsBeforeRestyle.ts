import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillListviewDefaultsBeforeRestyle1787788800000';
const BATCH_SIZE = 2000;

const COMPONENT_TYPE = 'Listview';

// A Listview missing these keys would take the restyled defaults through
// AppsUtilService.buildComponentMetaDefinition, so pin the pre-restyle values instead.
// The restyled `data` is only placeholder content, so it is deliberately not pinned here.
const PROPERTY_KEYS = ['rowHeight'];
const STYLE_KEYS = ['borderRadius'];

const PROPERTIES_PATCH = JSON.stringify({
  rowHeight: { value: '100' },
});

const STYLES_PATCH = JSON.stringify({
  borderRadius: { value: '{{6}}' },
});

export class BackfillListviewDefaultsBeforeRestyle1787788800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updatedAppVersionIds = new Set<string>();

    // `?&` is "contains all of these keys", so this matches a component missing ANY pinned key.
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = $1
         AND (
           properties IS NULL OR NOT (properties::jsonb ?& $2::text[])
           OR styles IS NULL OR NOT (styles::jsonb ?& $3::text[])
         )`,
      [COMPONENT_TYPE, PROPERTY_KEYS, STYLE_KEYS]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Total Listview widgets to pin: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = $1
           AND id > $2
           AND (
             properties IS NULL OR NOT (properties::jsonb ?& $3::text[])
             OR styles IS NULL OR NOT (styles::jsonb ?& $4::text[])
           )
         ORDER BY id ASC
         LIMIT $5`,
        [COMPONENT_TYPE, lastId, PROPERTY_KEYS, STYLE_KEYS, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      // Right operand wins in jsonb `||`, so a saved value is never overwritten.
      await queryRunner.query(
        `UPDATE components
         SET properties = ($1::jsonb || COALESCE(properties, '{}')::jsonb)::json,
             styles = ($2::jsonb || COALESCE(styles, '{}')::jsonb)::json
         WHERE id = ANY($3::uuid[])`,
        [PROPERTIES_PATCH, STYLES_PATCH, ids]
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

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill finished. Updated: ${totalUpdated}`);

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
