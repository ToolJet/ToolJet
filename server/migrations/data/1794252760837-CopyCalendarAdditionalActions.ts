import { QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { DataMigration } from '../../src/migration-helpers/migration-mode';
import {
  ComponentKeyMove,
  copyMovedKeys,
  createKeyMoveSync,
  dropKeyMoveSync,
} from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: copy, sync trigger and cleanup come from one declaration

const MIGRATION_NAME = 'CopyCalendarAdditionalActions1794252760837';
/** Components that get a plain-text tooltipFormat: a key added where missing. */
const NEEDS_TOOLTIP_FORMAT = `type = 'Calendar' AND COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltipFormat'`;

/**
 * Calendar modernization (bug-fix batch 2026-10-27): `visibility` moves from styles to properties (the inspector's
 * Additional Actions, like every modern widget; Calendar never had a `disabledState`), the universal tooltip to
 * `properties.tooltip`, and the universal box shadow to `styles.boxShadow`. Old exports get the same moves on import
 * (`NewRevampedComponents` in app-import-export.service.ts). A value saved before the upgrade wins over the new
 * defaults. Shared with the cleanup.
 */
export const CALENDAR_MOVES: ComponentKeyMove[] = [
  { types: ['Calendar'], from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
  {
    types: ['Calendar'],
    from: ['general_properties', 'tooltip'],
    to: ['properties', 'tooltip'],
    // The editor saves `{ value }`; a tooltip written through the API may be bare. Both releases read the object.
    convert: {
      toNew: `CASE WHEN jsonb_typeof(value) = 'object' THEN value ELSE jsonb_build_object('value', value) END`,
      toOld: 'value',
    },
  },
  { types: ['Calendar'], from: ['general_styles', 'boxShadow'], to: ['styles', 'boxShadow'] },
];
/** Names the trigger that keeps both places equal until the cleanup. */
export const CALENDAR_SYNC = 'calendar_additional_actions';

export class CopyCalendarAdditionalActions1794252760837 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const touchedVersions = new Set(await copyMovedKeys(queryRunner, MIGRATION_NAME, CALENDAR_MOVES));

    // A tooltip that moves gets an explicit plain-text format: a key added where missing, nothing removed.
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${NEEDS_TOOLTIP_FORMAT}`);
    console.log(`${MIGRATION_NAME}: [START] Seed tooltipFormat | Total: ${count}`);
    const seeded: { app_version_id: string }[] = await queryRunner.query(
      `WITH seeded AS (
         UPDATE components
         SET properties = (COALESCE(properties::jsonb, '{}'::jsonb) || $1::jsonb)::json
         WHERE ${NEEDS_TOOLTIP_FORMAT}
         RETURNING page_id)
       SELECT p.app_version_id FROM seeded JOIN pages p ON p.id = seeded.page_id`,
      [JSON.stringify({ tooltipFormat: { value: 'plainText' } })]
    );
    seeded.forEach(({ app_version_id }) => app_version_id && touchedVersions.add(app_version_id));
    console.log(`${MIGRATION_NAME}: [SUCCESS] Seed tooltipFormat finished. Updated: ${seeded.length}`);

    if (touchedVersions.size) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: [...touchedVersions] },
        MIGRATION_NAME
      );
    }
  }

  /** Until the cleanup, keeps both places equal whatever release writes them. */
  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await createKeyMoveSync(queryRunner, CALENDAR_SYNC, CALENDAR_MOVES);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The copied keys stay: the previous release ignores them. Deleted app-history snapshots are unrecoverable.
    await queryRunner.query(dropKeyMoveSync(CALENDAR_SYNC));
  }
}
