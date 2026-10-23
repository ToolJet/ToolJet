import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillDaterangePickerLegacyInvalidDates1791158400000';
const BATCH_SIZE = 2000;

const COMPONENT_TYPE = 'DaterangePicker';

/**
 * DaterangePicker historically exposed the literal "Invalid date" for a
 * missing/unparseable date in `startDate`, `endDate`, and `selectedDateRange`
 * (on first render with no defaults, after picking only the start date, and
 * from the setDateRange action). The corrected runtime exposes `null` instead,
 * and `selectedDateRange` only once both ends are valid.
 *
 * `legacyInvalidDates` is an opt-in legacy marker that is NOT part of the
 * default widget config: new components omit it and get the corrected
 * behavior. Existing components are pinned to `{{true}}` here so apps that
 * string-match "Invalid date" keep working. The flag is cleared (set to
 * `{{false}}`) by the inspector when a legacy component's date data — Default
 * start date, Default end date, or Format — is explicitly edited, which
 * permanently opts it into the corrected behavior.
 */
const LEGACY_FLAG_PATCH = JSON.stringify({
  legacyInvalidDates: { value: '{{true}}' },
});

const PROPERTY_KEYS = ['legacyInvalidDates'];

export class BackfillDaterangePickerLegacyInvalidDates1791158400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updatedAppVersionIds = new Set<string>();

    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = $1
         AND (properties IS NULL OR NOT (properties::jsonb ?& $2::text[]))`,
      [COMPONENT_TYPE, PROPERTY_KEYS]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Total DaterangePicker widgets to pin: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = $1
           AND id > $2
           AND (properties IS NULL OR NOT (properties::jsonb ?& $3::text[]))
         ORDER BY id ASC
         LIMIT $4`,
        [COMPONENT_TYPE, lastId, PROPERTY_KEYS, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET properties = ($1::jsonb || COALESCE(properties, '{}')::jsonb)::json
         WHERE id = ANY($2::uuid[])`,
        [LEGACY_FLAG_PATCH, ids]
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
