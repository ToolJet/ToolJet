import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateCircularProgressbarProperties1758457644900 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      // Fetch components in batches using raw SQL
      const components = await queryRunner.query(
        `SELECT id, properties, styles, general_properties, general_styles
         FROM components
         WHERE type = 'CircularProgressBar'
         ORDER BY "created_at" ASC
         LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      await this.processUpdates(queryRunner, components);
      offset += batchSize;
    }
  }

  private async processUpdates(queryRunner: QueryRunner, components: any[]) {
    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};
      const styles = component.styles ? { ...component.styles } : {};
      const general = component.general_properties ? { ...component.general_properties } : {};
      const generalStyles = component.general_styles ? { ...component.general_styles } : {};

      if (!properties.labelType) {
        properties.labelType = {
          value: 'custom',
        };
      }

      if (!properties.text || !properties.text.value) {
        properties.text = {
          ...properties.text,
          value: '',
        };
      }

      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility;
      }

      if (styles.textSize) {
        styles.textSize = {
          ...styles.textSize,
          fxActive: true,
        };
      }

      if (!styles.completionColor) {
        styles.completionColor = {
          ...styles.color,
        };
      }

      if (styles.strokeWidth) {
        styles.strokeWidth = {
          ...styles.strokeWidth,
          fxActive: true,
        };
      }

      if (styles.counterClockwise) {
        styles.counterClockwise = {
          ...styles.counterClockwise,
          fxActive: true,
        };
      }

      if (styles.circleRatio) {
        styles.circleRatio = {
          ...styles.circleRatio,
          fxActive: true,
        };
      }

      if (generalStyles?.boxShadow) {
        styles.boxShadow = generalStyles.boxShadow;
        delete generalStyles.boxShadow;
      }

      if (general?.tooltip) {
        properties.tooltip = general.tooltip;
        delete general.tooltip;
      }

      // Updating component using raw query
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
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
