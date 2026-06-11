import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateShowFlagForCurrencyInput1764930484535
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties
                 FROM components
                 WHERE type = 'CurrencyInput'
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
      const properties = component.properties
        ? { ...component.properties }
        : {};

      if (properties.showFlag === undefined) {
        properties.showFlag = {
          value: true,
        };
      }

      await queryRunner.query(
        `UPDATE components
                 SET properties = $1
                 WHERE id = $2`,
        [properties, component.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
