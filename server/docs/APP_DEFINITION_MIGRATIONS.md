# App definition migrations (App Builder)

How to change the shape of stored app JSON under the schema, data and cleanup phases.

**Read this when** a change moves, renames, reformats or removes a key inside stored app JSON: component `properties`, `styles`, `general_properties`, `general_styles`, `validation` or `display_preferences`, and the same kind of change in event handlers, query options or page and app settings. Any `packages/widget-definitions` change that moves a key counts. How migrations run: [`MIGRATION_FLOW.md`](MIGRATION_FLOW.md). General rules: the Migrations section of [`../AGENTS.md`](../AGENTS.md#migrations).

## The rule

The previous release must keep rendering every saved app after an upgrade. It is the image you roll back to, old pods keep serving during a rolling deploy, and editor tabs opened before the upgrade keep saving. So stored JSON:

- **gains** keys in a release, through a data migration;
- **loses** a key only in a cleanup migration, which runs one upgrade after the release that stopped reading it;
- never changes a key's **meaning or format** in place. The new format gets a new key.

Why it matters: before any widget sees a component, the server fills every key its widget definition expects with that release's default (`buildComponentMetaDefinition` in `src/modules/apps/util.service.ts`). If a migration deletes `styles.visibility`, the previous release quietly renders the default: a hidden widget shows, a disabled editor becomes editable, a tooltip disappears. Nothing errors.

While both places exist, two things keep them honest:

- **A trigger keeps both places equal.** The data migration adds it and the cleanup drops it. Whatever saves a component (this release, an editor tab opened before the upgrade, an old pod, the release a rollback returns to), the trigger copies the value to the other place. No edit is lost, and a rollback shows every edit.
- **Release code sees only the new place.** The App Builder drops the old place when an app loads (`MOVED_COMPONENT_KEYS` in `packages/widget-definitions`). A reader that still uses the old place breaks in the release that moved the key, not one release later when the cleanup runs.

## Which change needs what

| Change | Release N (one PR) | Cleanup removes |
|---|---|---|
| Add a key with a default (backfill) | Data migration adds it where missing | Nothing |
| Move or rename a key | Data migration copies it and adds the sync trigger; code reads the new place; the move is registered for the App Builder | The trigger and the old key |
| Change a value's format | Data migration writes the new format under a new key; code reads it | The old key |
| Remove a key no code reads | Nothing (the code stopped reading it) | The key |
| Convert components to another widget type | Ship the new widget first; convert in a later release | — |

## Release N: one PR

1. **Readers.** The widget definition and every place that reads the key switch to the new place in this PR. The shared canvas code (`RenderWidget`, `WidgetWrapper`, `Grid`) already reads `properties.visibility ?? styles.visibility`; widget files that read the old place directly do not. Do not add a `properties.x ?? styles.x` fallback in a widget: the server has already filled `properties.x` with its default, so the fallback never runs for a saved app.
2. **Register the move** in `MOVED_COMPONENT_KEYS` (`packages/widget-definitions/src/movedComponentKeys.js`), with the widget definition's section names (`general`, `generalStyles`, `others`, not the column names). Add a widget spec for the moved key: seeded through the real store, it fails while any reader still uses the old place.
3. **Data migration** in `migrations/data/` (template below). Declare the moves once; `src/migration-helpers/component-key-moves.ts` turns them into the copy, the trigger and the cleanup:
   - `copyMovedKeys()` in `up()` copies each key where its new place is missing (a key already there wins), in batches of 2,000 by `id` with one bulk `UPDATE` each, and logs `[START] … | Total`, `[PROGRESS] i/total`, `[SUCCESS]`.
   - Pass the app versions it returns to `deleteAppHistoryForStructuralMigration`. Restoring an older snapshot would bring back rows without the new key.
   - `createKeyMoveSync()` in `beforeCommit()` adds the trigger. It pauses writes to `components`, never reads, until the data phase commits.
   - Never `- 'key'`, `#-`, `delete`, `unset()` or `omit()`; the lint rejects them in data migrations.
   - A current timestamp (`date +%s%3N`), the same one in the file name and at the end of the class name.
4. **Cleanup migration** in `migrations/cleanup/`, in the same PR (template below): `transaction = false`, `requires = '<the data migration class name>'`, and `contractMovedKeys()` with the same moves and sync name. It drops the trigger in its own short step, then per batch copies anything still missing and removes the old keys.
   - The runner holds it back on the upgrade that ships it and runs it on the next upgrade whose release adds a migration. An instance that skips your release waits one more upgrade. A fresh install runs both at once.
5. **Import of old exports.** Exports keep the old shape forever, and so do templates. Make `migrateProperties()` in `src/modules/apps/services/app-import-export.service.ts` convert them: add the widget to `NewRevampedComponents` for the shared `visibility`, `disabledState`, `tooltip` and `boxShadow` moves, or add a widget-specific block like Navigation's.

**Release N+1 and later:** nothing is required. The cleanup runs by itself. The `MOVED_COMPONENT_KEYS` entry can stay; once the cleanup has run there is nothing left for it to drop.

## Templates

Data migration, `migrations/data/1793400000000-CopySvgImageAdditionalActions.ts`:

```ts
import { QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { DataMigration } from '../../src/migration-helpers/migration-mode';
import {
  ComponentKeyMove,
  copyMovedKeys,
  createKeyMoveSync,
  dropKeyMoveSync,
} from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: copy, sync trigger and cleanup come from one declaration

const MIGRATION_NAME = 'CopySvgImageAdditionalActions1793400000000';

/** SvgImage's visibility, tooltip and box shadow move to the places the other widgets use. Shared with the cleanup. */
export const SVG_IMAGE_MOVES: ComponentKeyMove[] = [
  { types: ['SvgImage'], from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
  { types: ['SvgImage'], from: ['general_properties', 'tooltip'], to: ['properties', 'tooltip'] },
  { types: ['SvgImage'], from: ['general_styles', 'boxShadow'], to: ['styles', 'boxShadow'] },
];
/** Names the trigger that keeps both places equal until the cleanup. */
export const SVG_IMAGE_SYNC = 'svg_image_additional_actions';

export class CopySvgImageAdditionalActions1793400000000 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const touchedVersions = await copyMovedKeys(queryRunner, MIGRATION_NAME, SVG_IMAGE_MOVES);
    if (touchedVersions.length) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: touchedVersions },
        MIGRATION_NAME
      );
    }
  }

  /** Until the cleanup, keeps both places equal whatever release writes them. */
  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await createKeyMoveSync(queryRunner, SVG_IMAGE_SYNC, SVG_IMAGE_MOVES);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The copied keys stay: the previous release ignores them. Deleted app-history snapshots are unrecoverable.
    await queryRunner.query(dropKeyMoveSync(SVG_IMAGE_SYNC));
  }
}
```

Cleanup migration, same PR, `migrations/cleanup/1793400000001-DropSvgImageOldAdditionalActions.ts`:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import { SVG_IMAGE_MOVES, SVG_IMAGE_SYNC } from '../data/1793400000000-CopySvgImageAdditionalActions'; // migration-import-allowed: the moves this cleanup finishes

export class DropSvgImageOldAdditionalActions1793400000001 implements MigrationInterface {
  transaction = false;
  requires = 'CopySvgImageAdditionalActions1793400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, SVG_IMAGE_SYNC, SVG_IMAGE_MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
```

App Builder, same PR, in `packages/widget-definitions/src/movedComponentKeys.js` (section names as in the widget definition):

```js
export const MOVED_COMPONENT_KEYS = {
  SvgImage: [
    { from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
    { from: ['general', 'tooltip'], to: ['properties', 'tooltip'] },
    { from: ['generalStyles', 'boxShadow'], to: ['styles', 'boxShadow'] },
  ],
};
```

## What this protects, and what it does not

| Situation | Result |
|---|---|
| Roll back to the previous image after the upgrade | Renders as before, with every edit made since: the trigger kept the old places current |
| An editor tab opened before the upgrade, or an old pod, saves a widget | The trigger carries the value to the new place: this release shows it and the cleanup keeps it |
| Edits made after a rollback, then upgraded again | Kept: the trigger stays until the cleanup runs |
| A widget created by this release | Gets the old places too, so the previous release renders it |
| A reader that still uses the old place | Breaks in this release, in dev and in specs: the App Builder dropped the old place on load |
| A release skipped, then upgraded | The copy runs; the cleanup waits one more upgrade, so the skipped-from release can still be rolled back to |
| One save writes both places with different values | The new place wins |
| Pasting a widget copied from an editor tab of the previous release | The moved key takes this release's default: the copy only carries the old place |
| Writes with triggers off (`session_replication_role = replica`, `pg_restore --disable-triggers`) | Not synced. The cleanup still copies a missing new key, but such an edit at the old place is lost |
| Upgrading across migrations older than the cutoff (`MIGRATION_AUTHORING_RULES_CUTOFF`) | Not covered; rolling back needs the pre-upgrade backup |

## Review checklist

- [ ] Every reader of the key switched to the new place in this PR; no widget-level `??` fallback.
- [ ] The move is in `MOVED_COMPONENT_KEYS`, and a widget spec covers the moved key.
- [ ] No data migration removes a key (`- 'key'`, `#-`, `delete`, `unset()`, `omit()`). The lint enforces this.
- [ ] No key changes format or meaning in place; the new format has a new key.
- [ ] The data migration declares its moves once, copies with `copyMovedKeys()`, clears app history for the versions it returns and adds the trigger in `beforeCommit()`.
- [ ] The cleanup `requires` the data migration and calls `contractMovedKeys()` with the same moves and sync name.
- [ ] `migrateProperties()` converts old exports and templates for this widget.
- [ ] One migration per widget change, timestamped now, with the same timestamp in the file name and the class name.

## Tests

| File | Covers |
|---|---|
| `server/test/modules/migrations/e2e/appbuilder-key-move.spec.ts` | The real runner on a key move: the copy and the trigger in the data phase, the cleanup held back on that upgrade and run on the next, in async and blocking mode, and a fresh install. Edits from an editor tab opened before the upgrade, before and after a rollback, widgets created by either release, other widget types. Row locks only in the copy; adding the trigger pauses writes, never reads |
| `server/test/modules/migrations/unit/component-key-moves.spec.ts` | The cleanup drops the trigger in its own transaction, before the batches that remove old keys |
| `server/test/modules/migrations/unit/legacy-3-21-58-upgrade.spec.ts` | The 3.21.58 branch key swap runs after a later migration's `beforeCommit()`, so the trigger never waits under its lock |
| `server/test/modules/migrations/unit/migration-lint.spec.ts` | Data migrations that remove JSON keys are rejected, including in helpers `up()` calls; cleanup may remove them |
| `frontend/src/AppBuilder/_stores/utils/__tests__/dropMovedComponentKeys.spec.ts` | The App Builder drops a moved key's old place on load, per component type, and copies only what it changes |
