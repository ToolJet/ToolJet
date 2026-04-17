import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillShowRefreshButtonTable1776410489284 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties
         FROM components
         WHERE type = 'Table'
         ORDER BY "created_at" ASC
         LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      for (const component of components) {
        const properties = component.properties ? { ...component.properties } : {};

        if (properties.showRefreshButton === undefined) {
          properties.showRefreshButton = {
            value: '{{false}}',
          };

          await queryRunner.query(`UPDATE components SET properties = $1 WHERE id = $2`, [properties, component.id]);
        }
      }

      offset += batchSize;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
