import { Component } from '@entities/component.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { processDataInBatches } from '@helpers/migration.helper';

export class StepsV2Migration1742369436314 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const componentTypes = ['Steps'];
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

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async processUpdates(entityManager, components) {
    for (const component of components) {
      const properties = component.properties;
      const styles = component.styles;
      const general = component.general;
      const generalStyles = component.generalStyles;
      const validation = component.validation;

      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility;
      }
      if (styles.theme) {
        properties['variant'] = styles.theme;
        delete styles.theme;
      }
      if (styles.color) {
        styles['completedAccent'] = styles.color;
      }
      delete styles.color;
      if (styles.textColor) {
        styles['completedLabel'] = styles.textColor;
        styles['incompletedLabel'] = styles.textColor;
        styles['currentStepLabel'] = styles.textColor;
      }
      delete styles.textColor;
      if (properties.steps) {
        properties['schema'] = properties.steps;
        delete properties.steps;
        properties['advanced'] = { value: '{{true}}' };
      }

      // if (properties.stepsSelectable) {
      //   properties.disabledState = styles.disabledState;
      //   delete styles.disabledState;
      // }

      // if (generalStyles?.boxShadow) {
      //   styles.boxShadow = generalStyles?.boxShadow;
      //   delete generalStyles?.boxShadow;
      // }

      await entityManager.update(Component, component.id, {
        properties,
        styles,
        general,
        generalStyles,
        validation,
      });
    }
  }
}
