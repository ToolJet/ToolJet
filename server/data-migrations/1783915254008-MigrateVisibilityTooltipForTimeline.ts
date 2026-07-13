import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'MigrateVisibilityTooltipForTimeline';
const TYPE = 'Timeline';

export class MigrateVisibilityTooltipForTimeline1783915254008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [TYPE]);
    const totalComponents = parseInt(countResult[0].count, 10);

    if (totalComponents === 0) {
      console.log(`${MIGRATION_NAME}: no Timeline components found.`);
      return;
    }

    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalComponents);

    while (hasMoreData) {
      // Fetch components in batches using raw SQL
      const components = await queryRunner.query(
        `SELECT id, properties, styles, general_properties, general_styles
                     FROM components
                     WHERE type = $1
                     ORDER BY "created_at" ASC
                     LIMIT $2 OFFSET $3`,
        [TYPE, batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      totalUpdated += await this.processUpdates(queryRunner, components, migrationProgress);
      offset += batchSize;
    }

    // Timeline's visibility/tooltip/boxShadow moved into their new buckets and tooltipFormat was
    // backfilled — a structural change to the component definition. Invalidate app version history
    // so stale undo/redo snapshots don't resurrect the old shape.
    const versions: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT p.app_version_id FROM components c
         INNER JOIN pages p ON c.page_id = p.id WHERE c.type = $1`,
      [TYPE]
    );
    await deleteAppHistoryForStructuralMigration(
      queryRunner.manager,
      { appVersionIds: versions.map((v) => v.app_version_id) },
      MIGRATION_NAME
    );

    console.log(`${MIGRATION_NAME}: completed. Updated ${totalUpdated} components.`);
  }

  private async processUpdates(
    queryRunner: QueryRunner,
    components: any[],
    migrationProgress: MigrationProgress
  ): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};
      const styles = component.styles ? { ...component.styles } : {};
      const general = component.general_properties ? { ...component.general_properties } : {};
      const generalStyles = component.general_styles ? { ...component.general_styles } : {};

      // visibility: styles → properties. Only fill the target when unset so a value the user
      // may already have on properties is preserved; always drop the stale styles key.
      if (styles.visibility !== undefined) {
        if (properties.visibility === undefined) {
          properties.visibility = styles.visibility;
        }
        delete styles.visibility;
      }

      // tooltip: general_properties → properties (same preserve-then-delete rule).
      if (general?.tooltip !== undefined) {
        if (properties.tooltip === undefined) {
          properties.tooltip = general.tooltip;
        }
        delete general.tooltip;
      }

      // tooltipFormat: new property that pairs with the properties-based tooltip. Existing
      // Timeline apps predate it (the BackfillTooltipFormat migration didn't cover Timeline),
      // so backfill the default when absent.
      if (properties.tooltipFormat === undefined) {
        properties.tooltipFormat = { value: 'plainText' };
      }

      // boxShadow: general_styles → styles (same preserve-then-delete rule).
      if (generalStyles?.boxShadow !== undefined) {
        if (styles.boxShadow === undefined) {
          styles.boxShadow = generalStyles.boxShadow;
        }
        delete generalStyles.boxShadow;
      }

      await queryRunner.query(
        `UPDATE components
           SET properties = $1, styles = $2, general_properties = $3, general_styles = $4
           WHERE id = $5`,
        [
          JSON.stringify(properties),
          JSON.stringify(styles),
          JSON.stringify(general),
          JSON.stringify(generalStyles),
          component.id,
        ]
      );

      updatedCount++;

      migrationProgress.show();
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
