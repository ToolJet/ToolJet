import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MoveVisibilityDisabledStatesToPropertiesTextarea1736448327127 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        return await entityManager.find(Component, {
          where: { type: 'TextArea' },
          order: { createdAt: 'ASC' },
        });
      },
      async (entityManager: EntityManager, components: Component[]) => {
        await this.processUpdates(entityManager, components);
      },
      batchSize
    );
  }

  private async processUpdates(entityManager, components) {
    for (const component of components) {
      const properties = component.properties;
      const styles = component.styles;
      const general = component.general;
      const generalStyles = component.generalStyles;
      const validation = component.validation;

      if (styles.visibility) {
        properties.visibility = styles?.visibility;
        delete styles?.visibility;
      }

      if (styles.disabledState) {
        properties.disabledState = styles?.disabledState;
        delete styles?.disabledState;
      }

      if (generalStyles?.boxShadow) {
        styles.boxShadow = generalStyles?.boxShadow;
        delete generalStyles?.boxShadow;
      }

      // Label and value
      if (properties.label == undefined || null) {
        properties.label = '';
      }

      await entityManager.update(Component, component.id, {
        properties,
        styles,
        general,
        generalStyles,
        validation,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
