import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateVisibilityDisabledHighlightedStatesForTabs1752434805432 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        return await entityManager.find(Component, {
          where: { type: 'Tabs' },
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

      if (styles.highlightColor) {
        styles.selectedText = styles.highlightColor;
        styles.accent = styles.highlightColor;
        delete styles.highlightColor;
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
