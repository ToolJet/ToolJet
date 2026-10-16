import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'MigrateTooltipForHtmlComponent';
const TYPE = 'Html';

/**
 * Html was treated as revamped on the import path — it is listed in NewRevampedComponents, so
 * importing an app moves general_properties.tooltip into properties.tooltip and deletes the
 * original (app-import-export.service.ts migrateProperties). The canvas, however, still read the
 * tooltip from general_properties, so every imported Html tooltip rendered blank.
 *
 * Html is now read from properties like the other revamped widgets. MoveVisibilityForHtmlComponent
 * already moved this widget's visibility and boxShadow but never its tooltip — its own rollback
 * comment mentions a tooltip it never touched — and BackfillTooltipFormat skipped Html too. This
 * migration finishes that job for apps already in the database, which the import-time migration
 * never reaches because it only runs on import.
 */
export class MigrateTooltipForHtmlComponent1792137283395 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [TYPE]);
    const totalComponents = parseInt(countResult[0].count, 10);

    if (totalComponents === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No Html components found. | Total: 0`);
      return;
    }

    console.log(
      `${MIGRATION_NAME}: [START] Move Html tooltip to properties + backfill tooltipFormat | Total: ${totalComponents}`
    );
    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalComponents);

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties, general_properties
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

    // The tooltip moved buckets and tooltipFormat was backfilled — a structural change to the
    // component definition. Invalidate app version history so stale undo/redo snapshots don't
    // resurrect the old shape.
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
      `${MIGRATION_NAME}: [SUCCESS] Move Html tooltip to properties + backfill tooltipFormat finished. Updated ${totalUpdated} components.`
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
      const general = component.general_properties ? { ...component.general_properties } : {};

      // tooltip: general_properties → properties. Only fill the target when unset so a value the
      // user may already have on properties is preserved; always drop the stale general key. This
      // is the same preserve-then-delete rule the import path applies.
      if (general?.tooltip !== undefined) {
        if (properties.tooltip === undefined) {
          properties.tooltip = general.tooltip;
        }
        delete general.tooltip;
      }

      // tooltipFormat pairs with the properties-based tooltip. Existing Html apps predate it —
      // BackfillTooltipFormat did not cover Html — so backfill the default when absent.
      if (properties.tooltipFormat === undefined) {
        properties.tooltipFormat = { value: 'plainText' };
      }

      await queryRunner.query(`UPDATE components SET properties = $1, general_properties = $2 WHERE id = $3`, [
        JSON.stringify(properties),
        JSON.stringify(general),
        component.id,
      ]);

      updatedCount++;

      migrationProgress.show();
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
