import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTooltipForKanbanComponent1758569631987 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      // Fetch components in batches using raw SQL
      const components = await queryRunner.query(
        `SELECT id, properties, general_properties
             FROM components
             WHERE type = 'Kanban'
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
      const general = component.general_properties ? { ...component.general_properties } : {};

      if (general?.tooltip) {
        properties.tooltip = general.tooltip;
        delete general.tooltip;
      }

      // Updating component using raw query
      await queryRunner.query(
        `UPDATE components
               SET properties = $1, general_properties = $2
               WHERE id = $3`,
        [JSON.stringify(properties), JSON.stringify(general), component.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
