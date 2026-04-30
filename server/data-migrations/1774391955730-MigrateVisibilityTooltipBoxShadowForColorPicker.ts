import { MigrationProgress } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateVisibilityTooltipBoxShadowForColorPicker1774391955730 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = 'ColorPicker'`);
    const totalComponents = parseInt(countResult[0].count);

    if (totalComponents === 0) {
      console.log('MigrateVisibilityTooltipBoxShadowForColorPicker: no ColorPicker components found.');
      return;
    }

    const migrationProgress = new MigrationProgress('MigrateVisibilityTooltipBoxShadowForColorPicker', totalComponents);

    while (hasMoreData) {
      // Fetch components in batches using raw SQL
      const components = await queryRunner.query(
        `SELECT id, properties, styles, general_properties, general_styles
                     FROM components
                     WHERE type = 'ColorPicker'
                     ORDER BY "created_at" ASC
                     LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      totalUpdated += await this.processUpdates(queryRunner, components, migrationProgress);
      offset += batchSize;
    }

    console.log(`MigrateVisibilityTooltipBoxShadowForColorPicker: completed. Updated ${totalUpdated} components.`);
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

      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility;
      }

      if (general?.tooltip) {
        properties.tooltip = general?.tooltip;
        delete general?.tooltip;
      }

      if (generalStyles?.boxShadow) {
        styles.boxShadow = generalStyles?.boxShadow;
        delete generalStyles?.boxShadow;
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
