import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillStripPercentRangeSliderV21794252760835';
const BATCH_SIZE = 2000;
const NO_ID = '00000000-0000-0000-0000-000000000000';
const STRIP_PERCENT = JSON.stringify({ stripPercent: { value: '{{true}}' } });
const WITHOUT_FLAG = `type = 'RangeSliderV2' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'stripPercent'`;

/**
 * RangeSliderV2 stripped the first `%` from every mark label at render, so a slider
 * configured with the shipped default marks `25%`/`50%`/`75%` displayed `25`/`50`/`75`.
 * That strip is now conditional, and this marks the components that already existed so
 * they keep rendering exactly as their builders see them today.
 *
 * `stripPercent` is deliberately NOT a registered property: it is absent from the widget
 * config, so it never appears in the inspector and a newly dropped slider never carries
 * it. Absence is what tells a new slider from an old one.
 *
 * Raw SQL, batched by id: a migration must not import a TypeORM entity (scripts/check-migration-imports.mjs).
 */
export class BackfillStripPercentRangeSliderV21794252760835 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${WITHOUT_FLAG}`);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfill stripPercent | Total: ${total}`);

    const touchedVersions = new Set<string>();
    let lastId = NO_ID;
    let done = 0;
    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components WHERE ${WITHOUT_FLAG} AND id > $1 ORDER BY id LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (!rows.length) break;
      lastId = rows[rows.length - 1].id;
      const versions: { app_version_id: string }[] = await queryRunner.query(
        `WITH flagged AS (
           UPDATE components SET properties = (COALESCE(properties::jsonb, '{}'::jsonb) || $1::jsonb)::json
           WHERE id = ANY($2::uuid[]) RETURNING page_id)
         SELECT DISTINCT p.app_version_id FROM flagged JOIN pages p ON p.id = flagged.page_id`,
        [STRIP_PERCENT, rows.map((row) => row.id)]
      );
      versions.forEach(({ app_version_id }) => app_version_id && touchedVersions.add(app_version_id));
      done += rows.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${((done / total) * 100).toFixed(1)}%)`);
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill stripPercent finished. Updated: ${done}`);

    // A snapshot taken before this ran carries no `stripPercent`, so restoring an app to one
    // would put the pre-fix mark labels straight back onto components this just corrected.
    // Same reason BackfillTooltipFormat and BackfillCollapseWhenHiddenForRemainingComponents
    // clear theirs.
    if (touchedVersions.size) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: [...touchedVersions] },
        MIGRATION_NAME
      );
    }
  }

  /**
   * Removes the key again, restoring the pre-migration state: `stripPercent` exists in no
   * release before this one, so a RangeSliderV2 carrying it got it either from `up()` or
   * from the matching backfill in `app-import-export.service.ts`. Both exist only to serve
   * this flag, so clearing every occurrence is the faithful inverse.
   *
   * Reverting leaves those sliders rendering the `%` in their mark labels — which is the
   * point: without the production change this undoes, nothing reads the key at all.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE components SET properties = (properties::jsonb - 'stripPercent')::json
       WHERE type = 'RangeSliderV2' AND COALESCE(properties::jsonb, '{}'::jsonb) ? 'stripPercent'`
    );
  }
}
