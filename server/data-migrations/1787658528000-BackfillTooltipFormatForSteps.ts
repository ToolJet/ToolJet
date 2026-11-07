import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillTooltipFormatForSteps1787658528000';
const BATCH_SIZE = 2000;

/** Steps rows that still miss a key they can get. Shared with the cleanup. */
export const STEPS_NEEDS_COPY = `type = 'Steps' AND (
    (COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip')
    OR (NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltipFormat'))`;

/**
 * Copies tooltip into properties, the tooltipFormat default.
 * Existing values win and the old keys stay. Shared with the cleanup.
 */
export const STEPS_COPY_SET = `
  properties = (COALESCE(properties::jsonb, '{}'::jsonb)
    || CASE WHEN COALESCE(general_properties::jsonb, '{}'::jsonb) ? 'tooltip' AND NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltip'
         THEN jsonb_build_object('tooltip', general_properties::jsonb -> 'tooltip') ELSE '{}'::jsonb END
    || CASE WHEN NOT COALESCE(properties::jsonb, '{}'::jsonb) ? 'tooltipFormat'
         THEN '{"tooltipFormat":{"value":"plainText"}}'::jsonb ELSE '{}'::jsonb END)::json`;

export class BackfillTooltipFormatForSteps1787658528000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE ${STEPS_NEEDS_COPY}`);
    const total = parseInt(count, 10);
    if (total === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No Steps components need the copy. | Total: 0`);
      return;
    }
    console.log(`${MIGRATION_NAME}: [START] Copy Steps tooltip/tooltipFormat | Total: ${total}`);

    const touchedVersions = new Set<string>();
    let lastId = '00000000-0000-0000-0000-000000000000';
    let done = 0;
    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components WHERE ${STEPS_NEEDS_COPY} AND id > $1 ORDER BY id LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (!rows.length) break;
      lastId = rows[rows.length - 1].id;
      const ids = rows.map((row) => row.id);

      await queryRunner.query(`UPDATE components SET ${STEPS_COPY_SET} WHERE id = ANY($1::uuid[])`, [ids]);

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
  }
}
