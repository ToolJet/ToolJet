import { Component } from '@entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const componentTypes = ['Checkbox', 'Button'];
const batchSize = 100;

export class MoveCheckboxButtonDisabledToProperties1715248128046 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  private async processUpdates(entityManager, components) {
    for (const component of components) {
      const properties = component.properties;
      const styles = component.styles;
      const general = component.general;
      const generalStyles = component.generalStyles;

      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility;
      }

      if (styles.disabledState) {
        properties.disabledState = styles.disabledState;
        delete styles.disabledState;
      }

      if (general?.tooltip) {
        properties.tooltip = general?.tooltip;
        delete general?.tooltip;
      }

      if (generalStyles?.boxShadow) {
        styles.boxShadow = generalStyles?.boxShadow;
        delete generalStyles?.boxShadow;
      }

      await entityManager.update(Component, component.id, {
        properties,
        styles,
        general,
        generalStyles,
      });
    }
  }

  private async rollbackUpdates(entityManager, components) {
    for (const component of components) {
      const properties = component.properties;
      const styles = component.styles;
      const general = component.general;
      const generalStyles = component.generalStyles;

      if (properties.visibility !== undefined) {
        styles.visibility = properties.visibility;
        delete properties.visibility;
      }

      if (properties.disabledState !== undefined) {
        styles.disabledState = properties.disabledState;
        delete properties.disabledState;
      }

      if (properties.tooltip !== undefined) {
        general.tooltip = properties.tooltip;
        delete properties.tooltip;
      }

      if (styles.boxShadow !== undefined) {
        generalStyles.boxShadow = styles.boxShadow;
        delete styles.boxShadow;
      }

      await entityManager.update(Component, component.id, {
        properties,
        styles,
        general,
        generalStyles,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
          await this.rollbackUpdates(entityManager, components);
        },
        batchSize
      );
    }
  }
}
