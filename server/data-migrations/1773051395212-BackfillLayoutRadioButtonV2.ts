import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { Component } from 'src/entities/component.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillLayoutRadioButtonV21773051395212 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;
    const totalComponents = await entityManager.count(Component, {
      where: { type: 'RadioButtonV2' },
    });

    if (totalComponents === 0) {
      console.log('BackfillLayoutRadioButtonV2: no RadioButtonV2 components found.');
      return;
    }

    const migrationProgress = new MigrationProgress('BackfillLayoutRadioButtonV2', totalComponents);
    let updated = 0;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.find(Component, {
          where: { type: 'RadioButtonV2' },
          order: { createdAt: 'ASC' },
          skip,
          take,
        });
      },
      async (entityManager: EntityManager, components: Component[]) => {
        updated += await this.processUpdates(entityManager, components, migrationProgress);
      },
      batchSize
    );

    console.log(`BackfillLayoutRadioButtonV2: completed. Updated ${updated} components.`);
  }

  private async processUpdates(
    entityManager: EntityManager,
    components: Component[],
    migrationProgress: MigrationProgress
  ): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties || {};

      if (properties.layout === undefined) {
        properties.layout = { value: 'wrap' };

        await entityManager.update(Component, component.id, {
          properties,
        });
        updatedCount++;
      }

      migrationProgress.show();
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
