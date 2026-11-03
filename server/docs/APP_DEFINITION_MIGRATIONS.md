# App definition migrations (App Builder)

How to change the shape of stored app JSON under the schema, data and cleanup phases.

**Read this when** a change moves, renames, reformats or removes a key inside stored app JSON: component `properties`, `styles`, `general_properties`, `general_styles`, `validation` or `display_preferences`, and the same kind of change in event handlers, query options or page and app settings. Any `packages/widget-definitions` change that moves a key counts. How migrations run: [`MIGRATION_FLOW.md`](MIGRATION_FLOW.md). General rules: the Migrations section of [`../AGENTS.md`](../AGENTS.md#migrations).

## The rule

The previous release must keep rendering every saved app after an upgrade. It is the image you roll back to, old pods keep serving during a rolling deploy, and editor tabs opened before the upgrade keep saving. So stored JSON:

- **gains** keys in a release, through a data migration;
- **loses** a key only in a cleanup migration, which runs one upgrade after the release that stopped reading it;
- never changes a key's **meaning or format** in place. The new format gets a new key.

Why it matters: before any widget sees a component, the server fills every key its widget definition expects with that release's default (`buildComponentMetaDefinition` in `src/modules/apps/util.service.ts`). If a migration deletes `styles.visibility`, the previous release quietly renders the default: a hidden widget shows, a disabled editor becomes editable, a tooltip disappears. Nothing errors.

## Which change needs what

| Change | Release N (one PR) | Cleanup removes |
|---|---|---|
| Add a key with a default (backfill) | Data migration adds it where missing | Nothing |
| Move or rename a key | Data migration copies it; code reads the new place | The old key |
| Change a value's format | Data migration writes the new format under a new key; code reads it | The old key |
| Remove a key no code reads | Nothing (the code stopped reading it) | The key |
| Convert components to another widget type | Ship the new widget first; convert in a later release | — |

## Release N: one PR

1. **Widget definition and widget code** read the new place only. Do not add a `properties.x ?? styles.x` fallback in the widget: the server has already filled `properties.x` with its default, so the fallback never runs for a saved app.
2. **Data migration** in `migrations/data/` (template below):
   - Adds keys only: `||` with `jsonb_build_object`. Never `- 'key'`, `#-`, `delete`, `unset()` or `omit()`; the lint rejects them in data migrations.
   - A key already at the new place wins, and values are copied as stored.
   - Selects only rows that still need the copy, so a rerun changes nothing.
   - Batches by `id` with one bulk `UPDATE` per batch, never `OFFSET` or one `UPDATE` per row. In async mode writes stay paused until the whole data phase commits.
   - Logs `[START] … | Total`, `[PROGRESS] i/total`, `[SUCCESS]`.
   - Calls `deleteAppHistoryForStructuralMigration` for the app versions it touched. Restoring an older snapshot would bring back rows without the new key.
   - Exports its copy SQL, so the cleanup can run it again.
   - Uses a current timestamp (`date +%s%3N`), the same one in the file name and at the end of the class name.
3. **Cleanup migration** in `migrations/cleanup/`, in the same PR (template below):
   - `transaction = false` and `requires = '<the data migration class name>'`.
   - One `withShortLock` step: run the copy again for rows old code saved after it ran, then remove each old key only where its new key exists.
   - The runner holds it back on the upgrade that ships it and runs it on the next upgrade. An instance that skips your release waits one more upgrade. A fresh install runs both at once.
4. **Import of old exports.** Exports keep the old shape forever, and so do templates. Make `migrateProperties()` in `src/modules/apps/services/app-import-export.service.ts` convert them: add the widget to `NewRevampedComponents` for the shared `visibility`, `disabledState`, `tooltip` and `boxShadow` moves, or add a widget-specific block like Navigation's.

**Release N+1 and later:** nothing is required. The cleanup runs by itself on the next upgrade. Remove any code that still reads the old place.

## Templates

Data migration, `migrations/data/1793400000000-CopySvgImageAdditionalActions.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'CopySvgImageAdditionalActions1793400000000';
const BATCH_SIZE = 2000;

/** Rows that still miss a new key they can get. Shared with the cleanup. */
export const SVG_NEEDS_COPY = `type = 'SvgImage' AND (
    (COALESCE(styles::jsonb, '{}'::jsonb) ? 'visibility' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'visibility')
    OR (COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip')
    OR (COALESCE(general_styles::jsonb, '{}'::jsonb) ? 'boxShadow' AND NOT COALESCE(styles::jsonb, '{}'::jsonb) ? 'boxShadow'))`;

/** Adds each key at its new place unless already there; the old places stay. Shared with the cleanup. */
export const SVG_COPY_SET = `
  properties = (COALESCE(properties::jsonb, '{}'::jsonb)
    || CASE WHEN COALESCE(styles::jsonb, '{}'::jsonb) ? 'visibility' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'visibility'
         THEN jsonb_build_object('visibility', styles::jsonb -> 'visibility') ELSE '{}'::jsonb END
    || CASE WHEN COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip'
         THEN jsonb_build_object('tooltip', general_properties::jsonb -> 'tooltip') ELSE '{}'::jsonb END)::json,
  styles = (COALESCE(styles::jsonb, '{}'::jsonb)
    || CASE WHEN COALESCE(general_styles::jsonb, '{}'::jsonb) ? 'boxShadow' AND NOT COALESCE(styles::jsonb, '{}'::jsonb) ? 'boxShadow'
         THEN jsonb_build_object('boxShadow', general_styles::jsonb -> 'boxShadow') ELSE '{}'::jsonb END)::json`;

export class CopySvgImageAdditionalActions1793400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${SVG_NEEDS_COPY}`);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Copy SvgImage visibility/tooltip/boxShadow | Total: ${total}`);

    const touchedVersions = new Set<string>();
    let lastId = '00000000-0000-0000-0000-000000000000';
    let done = 0;
    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components WHERE ${SVG_NEEDS_COPY} AND id > $1 ORDER BY id LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (!rows.length) break;
      lastId = rows[rows.length - 1].id;
      const ids = rows.map((row) => row.id);
      await queryRunner.query(`UPDATE components SET ${SVG_COPY_SET} WHERE id = ANY($1::uuid[])`, [ids]);
      const versions: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id FROM components c JOIN pages p ON p.id = c.page_id WHERE c.id = ANY($1::uuid[])`,
        [ids]
      );
      versions.forEach(({ app_version_id }) => app_version_id && touchedVersions.add(app_version_id));
      done += rows.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${((done / total) * 100).toFixed(1)}%)`);
    }

    if (touchedVersions.size) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: [...touchedVersions] },
        MIGRATION_NAME
      );
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Copy finished. Updated: ${done}`);
  }

  public async down(): Promise<void> {
    // Nothing to undo: up() only adds keys, and the previous release still reads the old ones.
    // The deleted app-history snapshots are unrecoverable; restore the pre-upgrade backup if needed.
  }
}
```

Cleanup migration, same PR, `migrations/cleanup/1793400000001-DropSvgImageOldAdditionalActions.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';
import { withShortLock } from '../../src/migration-helpers/with-short-lock'; // migration-import-allowed: cleanup steps must go through the short-lock helper
import { SVG_COPY_SET, SVG_NEEDS_COPY } from '../data/1793400000000-CopySvgImageAdditionalActions'; // migration-import-allowed: reruns the copy for late rows

export class DropSvgImageOldAdditionalActions1793400000001 implements MigrationInterface {
  transaction = false;
  requires = 'CopySvgImageAdditionalActions1793400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await withShortLock(queryRunner, [
      // Rows old code saved after the copy ran only have the old keys.
      `UPDATE components SET ${SVG_COPY_SET} WHERE ${SVG_NEEDS_COPY}`,
      // Each old key goes only where its new key exists.
      `UPDATE components SET
         styles = CASE WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'visibility'
                    THEN (styles::jsonb - 'visibility')::json ELSE styles END,
         general_properties = CASE WHEN COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip'
                    THEN (general_properties::jsonb - 'tooltip')::json ELSE general_properties END,
         general_styles = CASE WHEN COALESCE(styles::jsonb, '{}'::jsonb) ? 'boxShadow'
                    THEN (general_styles::jsonb - 'boxShadow')::json ELSE general_styles END
       WHERE type = 'SvgImage' AND (COALESCE(styles::jsonb, '{}'::jsonb) ? 'visibility'
         OR COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip'
         OR COALESCE(general_styles::jsonb, '{}'::jsonb) ? 'boxShadow')`,
    ]);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
```

## What this protects, and what it does not

| Situation | Result |
|---|---|
| Roll back to the previous image after the upgrade | Renders as before: the old keys are untouched until the cleanup |
| A release skipped, then upgraded | The copy runs; the cleanup waits one more upgrade, so the skipped-from release can still be rolled back to |
| An edit saved after the upgrade, then a rollback | The previous release shows the value from before the edit |
| A widget saved by old code after the copy ran: an editor tab opened before the upgrade, an old pod, the time rolled back | This release shows the widget's defaults until the cleanup copies it on the next upgrade |
| Upgrading across migrations older than the cutoff (`MIGRATION_AUTHORING_RULES_CUTOFF`) | Not covered; rolling back needs the pre-upgrade backup |

The two middle rows need server-side help to close: a save path that writes both places while both exist, and a read path that falls back to the old place when the new one is missing.

## Review checklist

- [ ] No data migration removes a key (`- 'key'`, `#-`, `delete`, `unset()`, `omit()`). The lint enforces this.
- [ ] No key changes format or meaning in place; the new format has a new key.
- [ ] The data migration selects only rows that still need the copy, batches by `id`, logs progress and clears app history for the versions it touched.
- [ ] The cleanup `requires` the data migration, reruns the copy first and removes an old key only where its new key exists.
- [ ] `migrateProperties()` converts old exports and templates for this widget.
- [ ] The widget reads only the new place.
- [ ] One migration per widget change, timestamped now, with the same timestamp in the file name and the class name.

## Tests

| File (under `server/test/modules/`) | Covers |
|---|---|
| `migrations/e2e/appbuilder-key-move.spec.ts` | The real runner on a key move: the copy in the data phase, the cleanup held back on that upgrade and run on the next, in async and blocking mode; rows old code saved after the copy; a fresh install; only row locks |
| `migrations/unit/migration-lint.spec.ts` | Data migrations that remove JSON keys are rejected, including in helpers `up()` calls; cleanup may remove them |
