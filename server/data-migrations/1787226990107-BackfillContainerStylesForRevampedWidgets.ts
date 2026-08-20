import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillContainerStylesForRevampedWidgets';

/* The Container style section (background / border / border radius) was added to these components,
 * and their widget configs default the new keys to the standard tokens. Existing rows have no saved value,
 * and AppsUtilService.buildComponentMetaDefinition merges the meta default *under* saved values on every load
 * so without this backfill an already-built app would gain a background, border or rounded corners it never had.
 *
 * This is therefore not only a "write the new defaults" backfill:
 * each key where required is pinned to the value that reproduces what the component actually rendered BEFORE the Container section existed.
 * Components dropped after this change still pick up the standard tokens from the widget config.
 *
 * This table is a deliberate copy of LEGACY_CONTAINER_STYLES in src/constants/app-import-export.constant.ts,
 * which applies the same pinning on the import path. It is duplicated rather than imported on purpose,
 * a data migration must keep behaving exactly as it did the day it ran, so it cannot depend on a shared constant that may be edited later.
 */
const LEGACY_CONTAINER_STYLES: Record<string, Record<string, { value: string | number }>> = {
  BoundedBox: {
    backgroundColor: { value: '#ffffff00' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  QrScanner: {
    backgroundColor: { value: '#ffffff00' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  Calendar: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
  },
  PDF: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
  },
  CustomComponent: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
  },
  FilePicker: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
    borderColor: { value: '#ffffff00' },
  },
  Html: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  IFrame: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
  Kanban: {
    backgroundColor: { value: '#ffffff00' },
    borderColor: { value: '#ffffff00' },
    borderRadius: { value: '{{0}}' },
  },
};

const TYPES = Object.keys(LEGACY_CONTAINER_STYLES);

export class BackfillContainerStylesForRevampedWidgets1787226990107 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = ANY($1)`, [TYPES]);
    const totalComponents = parseInt(countResult[0].count, 10);

    if (totalComponents === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No matching components found. | Total: 0`);
      return;
    }

    console.log(
      `${MIGRATION_NAME}: [START] Pin pre-revamp Container styles for ${TYPES.join(', ')} | Total: ${totalComponents}`
    );
    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalComponents);

    while (hasMoreData) {
      // Fetch components in batches using raw SQL
      const components = await queryRunner.query(
        `SELECT id, type, styles
                     FROM components
                     WHERE type = ANY($1)
                     ORDER BY "created_at" ASC
                     LIMIT $2 OFFSET $3`,
        [TYPES, batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      totalUpdated += await this.processUpdates(queryRunner, components, migrationProgress);
      offset += batchSize;
    }

    // New keys on the component definition — drop stale undo/redo snapshots that predate them.
    const versions: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT p.app_version_id FROM components c
         INNER JOIN pages p ON c.page_id = p.id WHERE c.type = ANY($1)`,
      [TYPES]
    );
    await deleteAppHistoryForStructuralMigration(
      queryRunner.manager,
      { appVersionIds: versions.map((v) => v.app_version_id) },
      MIGRATION_NAME
    );

    console.log(`${MIGRATION_NAME}: [SUCCESS] Finished. Updated ${totalUpdated} components.`);
  }

  private async processUpdates(
    queryRunner: QueryRunner,
    components: any[],
    migrationProgress: MigrationProgress
  ): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const styles = component.styles ? { ...component.styles } : {};
      const legacy = LEGACY_CONTAINER_STYLES[component.type];
      let changed = false;

      // Fill only what the row has no value for. Anything already saved is the user's own choice
      // — including a boxShadow that the preceding MigrateVisibilityDisableTooltipBoxShadow...
      // migration lifted out of general_styles — and must not be overwritten.
      for (const [key, legacyValue] of Object.entries(legacy)) {
        if (styles[key] === undefined) {
          styles[key] = { ...legacyValue };
          changed = true;
        }
      }

      if (changed) {
        await queryRunner.query(`UPDATE components SET styles = $1 WHERE id = $2`, [
          JSON.stringify(styles),
          component.id,
        ]);
        updatedCount++;
      }

      migrationProgress.show();
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
