import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateVisibilityDisabledStatesForIFrame1764763028973
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let hasMoreData = true;
    let offset = 0;

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties, styles
         FROM components
         WHERE type = 'IFrame'
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

  private async processUpdates(queryRunner: QueryRunner, components) {
    for (const component of components) {
      const properties = component.properties
        ? { ...component.properties }
        : {};
      const styles = component.styles ? { ...component.styles } : {};

      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility;
      }

      if (styles.disabledState) {
        properties.disabledState = styles.disabledState;
        delete styles.disabledState;
      }

      await queryRunner.query(
        `UPDATE components
         SET properties = $1, styles = $2
         WHERE id = $3`,
        [JSON.stringify(properties), JSON.stringify(styles), component.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
