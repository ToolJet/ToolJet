import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillLoadingStateListView1774412653881 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let processedCount = 0;
    let updatedCount = 0;
    let batchNumber = 0;

    const totalRecords = await queryRunner.query(
      `SELECT COUNT(*)::int AS count
       FROM components
       WHERE type = 'Listview'`
    );
    const totalCount = totalRecords[0]?.count ?? 0;

    if (totalCount === 0) {
      console.log('BackfillLoadingStateListView1774412653881: No components found to update.');
      return;
    }

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties, styles, general_properties, general_styles
         FROM components
         WHERE type = 'Listview'
         ORDER BY "created_at" ASC
         LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      batchNumber++;
      const batchUpdatedCount = await this.processUpdates(queryRunner, components);

      processedCount += components.length;
      updatedCount += batchUpdatedCount;
      const progress = Math.round((processedCount / totalCount) * 100);

      console.log(
        `BackfillLoadingStateListView1774412653881: Batch ${batchNumber} | Processed ${processedCount}/${totalCount} (${progress}%) | Updated ${updatedCount}`
      );

      offset += batchSize;
    }
  }

  private async processUpdates(queryRunner: QueryRunner, components: any[]): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};
      const styles = component.styles ? { ...component.styles } : {};
      const general = component.general_properties ? { ...component.general_properties } : {};
      const generalStyles = component.general_styles ? { ...component.general_styles } : {};
      let shouldUpdate = false;

      if (Object.prototype.hasOwnProperty.call(styles, 'visibility')) {
        if (properties.visibility === undefined) {
          properties.visibility = styles.visibility;
        }
        delete styles.visibility;
        shouldUpdate = true;
      }

      if (Object.prototype.hasOwnProperty.call(styles, 'disabledState')) {
        if (properties.disabledState === undefined) {
          properties.disabledState = styles.disabledState;
        }
        delete styles.disabledState;
        shouldUpdate = true;
      }

      if (Object.prototype.hasOwnProperty.call(general, 'tooltip')) {
        if (properties.tooltip === undefined) {
          properties.tooltip = general.tooltip;
        }
        delete general.tooltip;
        shouldUpdate = true;
      }

      if (properties.tooltip === undefined) {
        properties.tooltip = { value: '' };
        shouldUpdate = true;
      }

      if (Object.prototype.hasOwnProperty.call(generalStyles, 'boxShadow')) {
        if (styles.boxShadow === undefined) {
          styles.boxShadow = generalStyles.boxShadow;
        }
        delete generalStyles.boxShadow;
        shouldUpdate = true;
      }

      if (properties.loadingState === undefined) {
        properties.loadingState = { value: '{{false}}' };
        shouldUpdate = true;
      }

      if (!shouldUpdate) continue;

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
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
