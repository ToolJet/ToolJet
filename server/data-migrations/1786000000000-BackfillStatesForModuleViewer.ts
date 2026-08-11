import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillStatesForModuleViewer1786000000000';
const BATCH_SIZE = 2000;
const COMPONENT_TYPES = ['ModuleViewer'];

// The client never materialises a property key that is absent from the SAVED definition:
// resolveProperties() reduces over Object.entries(component.definition.properties), so a key
// that was never persisted resolves to `undefined` rather than to the config's
// validation.defaultValue. Rendering survives (undefined is falsy) but the widget then exposes
// `isVisible`/`isLoading`/`isDisabled` as undefined instead of booleans.
//
// `visibility` is included alongside the two new keys because ModuleViewer instances dropped
// before the dynamic-height change (#16807) have no `visibility` key either, and hit the same
// undefined exposure for the same reason.
const STATE_DEFAULTS: Record<string, string> = {
  visibility: '{{true}}',
  loadingState: '{{false}}',
  disabledState: '{{false}}',
};
const STATE_KEYS = Object.keys(STATE_DEFAULTS);

// Keys are a hardcoded constant, never user input — inlined as SQL literals so the statements
// stay readable and the bind-parameter numbering stays simple.
const KEY_ARRAY_SQL = `array[${STATE_KEYS.map((k) => `'${k}'`).join(',')}]`;
const MISSING_ANY_KEY_SQL = `NOT (COALESCE(properties::jsonb, '{}'::jsonb) ?& ${KEY_ARRAY_SQL})`;

// Guard each key independently rather than merging one patch object: a row may already carry
// `visibility` while lacking the other two, and a saved user value must never be overwritten.
const PER_KEY_PATCH_SQL = STATE_KEYS.map(
  (key) => `
    || CASE WHEN NOT (COALESCE(properties::jsonb, '{}'::jsonb) ? '${key}')
            THEN '${JSON.stringify({ [key]: { value: STATE_DEFAULTS[key] } })}'::jsonb
            ELSE '{}'::jsonb END`
).join('');

export class BackfillStatesForModuleViewer1786000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components WHERE type = ANY($1) AND ${MISSING_ANY_KEY_SQL}`,
      [COMPONENT_TYPES]
    );
    const total = parseInt(count, 10);

    if (total === 0) {
      console.log(`${MIGRATION_NAME}: no ModuleViewer components need backfilling.`);
      return;
    }
    console.log(`${MIGRATION_NAME}: [START] Backfill visibility/loading/disabled | Total: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = ANY($1)
           AND id > $2
           AND ${MISSING_ANY_KEY_SQL}
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPES, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET properties = (COALESCE(properties::jsonb, '{}'::jsonb)${PER_KEY_PATCH_SQL})::json
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      totalUpdated += rows.length;
      const percentage = ((totalUpdated / total) * 100).toFixed(1);
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfilled ${totalUpdated} ModuleViewer components.`);

    // Deliberately NOT calling deleteAppHistoryForStructuralMigration, unlike every sibling
    // backfill. Those are structural — they move keys between buckets (styles→properties,
    // general→properties), so old history deltas would replay against a shape that no longer
    // exists. This patch is purely additive: it only writes keys that were absent, so existing
    // deltas stay valid and there is nothing to peel.
    //
    // Accepted cost: restoring an app to a pre-migration history point brings back a definition
    // without these keys, degrading the three variables to undefined for that version until it
    // is re-saved. Judged far cheaper than destroying undo/version history for every app that
    // contains a Module.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op — backfills are not reversed.
  }
}
