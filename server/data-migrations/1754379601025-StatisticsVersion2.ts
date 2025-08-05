import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';

export class StatisticsVersion221754379601025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        return await entityManager.find(Component, {
          where: { type: 'Statistics' },
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

      if (properties.dataAlignment === undefined) {
        properties.dataAlignment = { value: 'center' };
      }

      if (properties.iconVisibility === undefined) {
        properties.iconVisibility = { value: false };
      }

      if (general?.tooltip) {
        properties.tooltip = general.tooltip;
        delete general.tooltip;
      }

      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility;
      }

      if (styles.secondaryTextColour) {
        styles.positiveSecondaryValueColor = styles.secondaryTextColour;
        styles.negativeSecondaryValueColor = styles.secondaryTextColour;
        delete styles.secondaryTextColour;
      }

      if (generalStyles?.boxShadow) {
        styles.boxShadow = generalStyles.boxShadow;
        delete generalStyles.boxShadow;
      }

      await entityManager.update(Component, component.id, {
        properties,
        styles,
        general,
        generalStyles,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
