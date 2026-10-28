import { Component } from 'src/entities/component.entity';

import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateContainerHeaderProperty1744097765065 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const componentTypes = ['Container'];
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    for (const componentType of componentTypes) {
      await processDataInBatches(
        entityManager,
        async (entityManager: EntityManager) => {
          return await entityManager.find(Component, {
            where: { type: componentType },
            order: { createdAt: 'ASC' },
          });
        },
        async (entityManager: EntityManager, components: Component[]) => {
          await this.processUpdates(entityManager, components);
        },
        batchSize
      );
    }
  }

  private async processUpdates(entityManager: EntityManager, components: Component[]) {
    for (const component of components) {
      const properties = component.properties;
      const styles = component.styles;
      const general = component.general;

      // Update showHeader property to false for old instances
      if (!properties.showHeader) {
        properties.showHeader = { value: '{{false}}' };
      }

      // Update the modal component with the modified properties
      await entityManager.update(Component, component.id, {
        properties,
        styles,
        general,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
