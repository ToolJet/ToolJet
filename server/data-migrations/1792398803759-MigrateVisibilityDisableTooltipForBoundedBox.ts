import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'MigrateVisibilityDisableTooltipForBoundedBox';
const TYPE = 'BoundedBox';

export class MigrateVisibilityDisableTooltipForBoundedBox1792398803759 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [TYPE]);
    const totalComponents = parseInt(countResult[0].count, 10);

    if (totalComponents === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No BoundedBox components found. | Total: 0`);
      return;
    }

    console.log(
      `${MIGRATION_NAME}: [START] Migrate BoundedBox visibility/disable/tooltip + backfill tooltipFormat | Total: ${totalComponents}`
    );
    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalComponents);
    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties, styles, general_properties
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

    // BoundedBox's visibility/disable/tooltip moved into properties and tooltipFormat was backfilled —
    // a structural change to the component definition. Invalidate app version history so stale
    // undo/redo snapshots don't resurrect the old shape.
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

    console.log(
      `${MIGRATION_NAME}: [SUCCESS] Migrate BoundedBox visibility/disable/tooltip + backfill tooltipFormat finished. Updated ${totalUpdated} components.`
    );
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

      // visibility / disabledState: styles → properties. Only fill the target when unset so a value
      // the user may already have on properties is preserved; always drop the stale styles key.
      for (const key of ['visibility', 'disabledState']) {
        if (styles[key] !== undefined) {
          if (properties[key] === undefined) {
            properties[key] = styles[key];
          }
          delete styles[key];
        }
      }

      // tooltip: general_properties → properties (same preserve-then-delete rule).
      if (general?.tooltip !== undefined) {
        if (properties.tooltip === undefined) {
          properties.tooltip = general.tooltip;
        }
        delete general.tooltip;
      }

      // tooltipFormat: new property that pairs with the properties-based tooltip. Existing
      // BoundedBoxes predate it, so backfill the default when absent.
      if (properties.tooltipFormat === undefined) {
        properties.tooltipFormat = { value: 'plainText' };
      }

      await queryRunner.query(
        `UPDATE components
           SET properties = $1, styles = $2, general_properties = $3
           WHERE id = $4`,
        [JSON.stringify(properties), JSON.stringify(styles), JSON.stringify(general), component.id]
      );

      updatedCount++;

      migrationProgress.show();
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
