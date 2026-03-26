import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '../src/helpers/migration.helper';

const MIGRATION_NAME = 'BackfillPlaceholderTextColor1774503863002';

export class BackfillPlaceholderTextColor1774503863002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 2000;
    const componentTypes = ['TextInput', 'NumberInput', 'PasswordInput', 'DropdownV2'];
    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;
    let batchNumber = 0;

    while (true) {
      // Cursor pagination on id — avoids OFFSET degradation on large tables
      // and is safe when rows share identical created_at timestamps.
      // Filter missing key at DB level to skip already-migrated rows entirely.
      // styles column is json type, so cast to jsonb for the ? operator.
      const rows = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = ANY($1)
           AND id > $2
           AND NOT (styles::jsonb ? 'placeholderTextColor')
         ORDER BY id ASC
         LIMIT $3`,
        [componentTypes, lastId, batchSize]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      // One bulk UPDATE for the entire batch instead of one UPDATE per row.
      // Cast json → jsonb to merge the new key, cast back to json to store.
      await queryRunner.query(
        `UPDATE components
         SET styles = (COALESCE(styles, '{}')::jsonb || '{"placeholderTextColor": {"value": "var(--cc-placeholder-text)"}}'::jsonb)::json
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      totalUpdated += ids.length;
      batchNumber++;
      console.log(`${MIGRATION_NAME}: Batch ${batchNumber} | Updated ${totalUpdated}`);
    }

    console.log(`${MIGRATION_NAME}: Done. Total updated: ${totalUpdated}`);

    // Clean up app history for all affected app versions.
    // Query directly by component type — avoids accumulating 500k IDs in memory
    // and skips the internal component → page lookup inside the helper.
    if (totalUpdated > 0) {
      const appVersionRows = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
         FROM components c
         INNER JOIN pages p ON c.page_id = p.id
         WHERE c.type = ANY($1)`,
        [componentTypes]
      );

      const appVersionIds = appVersionRows.map((r: any) => r.app_version_id);

      await deleteAppHistoryForStructuralMigration(queryRunner.manager, { appVersionIds }, MIGRATION_NAME);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
