import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class CurrencyInputNumberFormat1769580578105 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        return await entityManager.find(Component, {
          where: { type: 'CurrencyInput' },
          order: { createdAt: 'ASC' },
        });
      },
      async (entityManager: EntityManager, components: Component[]) => {
        await this.processUpdates(entityManager, components);
      },
      batchSize
    );
  }

  private async processUpdates(entityManager: EntityManager, components: Component[]) {
    for (const component of components) {
      const properties = component.properties;

      // Add numberFormat property if not present, default to 'us'
      if (!properties.numberFormat) {
        properties.numberFormat = { value: 'us' };
      }

      await entityManager.update(Component, component.id, {
        properties,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
