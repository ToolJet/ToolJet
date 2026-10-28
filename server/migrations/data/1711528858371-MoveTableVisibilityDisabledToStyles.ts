import { Component } from '@entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MoveTableVisibilityDisabledToStyles1711528858371 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const componentType = 'Table';
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        return await entityManager.find(Component, {
          where: { type: componentType },
          order: { createdAt: 'ASC' },
        });
      },
      async (entityManager: EntityManager, component: Component[]) => {
        await this.processUpdates(entityManager, component);
      },
      batchSize
    );
  }

  private async processUpdates(entityManager, components) {
    for (const component of components) {
      const properties = component.properties;
      const styles = component.styles;
      const generalStyles = component.generalStyles;

      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility;
      }

      if (styles.disabledState) {
        properties.disabledState = styles.disabledState;
        delete styles.disabledState;
      }

      if (generalStyles?.boxShadow) {
        styles.boxShadow = generalStyles?.boxShadow;
        delete generalStyles?.boxShadow;
      }

      if (properties && properties?.data?.value === undefined) {
        properties.data = {
          ...properties?.data,
          value:
            "{{ [ \n\t\t{ id: 1, name: 'Sarah', email: 'sarah@example.com'}, \n\t\t{ id: 2, name: 'Lisa', email: 'lisa@example.com'}, \n\t\t{ id: 3, name: 'Sam', email: 'sam@example.com'}, \n\t\t{ id: 4, name: 'Jon', email: 'jon@example.com'} \n] }}",
        };
      }

      await entityManager.update(Component, component.id, {
        properties,
        styles,
        generalStyles,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
