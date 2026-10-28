import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { Component } from 'src/entities/component.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

/**
 * RangeSliderV2 stripped the first `%` from every mark label at render, so a slider
 * configured with the shipped default marks `25%`/`50%`/`75%` displayed `25`/`50`/`75`.
 * That strip is now conditional, and this marks the components that already existed so
 * they keep rendering exactly as their builders see them today.
 *
 * `stripPercent` is deliberately NOT a registered property: it is absent from the widget
 * config, so it never appears in the inspector and a newly dropped slider never carries
 * it. Absence is what tells a new slider from an old one.
 */
export class BackfillStripPercentRangeSliderV21792950330429 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;
    const totalComponents = await entityManager.count(Component, {
      where: { type: 'RangeSliderV2' },
    });

    if (totalComponents === 0) {
      console.log('BackfillStripPercentRangeSliderV2: no RangeSliderV2 components found.');
      return;
    }

    const migrationProgress = new MigrationProgress('BackfillStripPercentRangeSliderV2', totalComponents);
    let updated = 0;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.find(Component, {
          where: { type: 'RangeSliderV2' },
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

    console.log(`BackfillStripPercentRangeSliderV2: completed. Updated ${updated} components.`);
  }

  private async processUpdates(
    entityManager: EntityManager,
    components: Component[],
    migrationProgress: MigrationProgress
  ): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties || {};

      if (properties.stripPercent === undefined) {
        properties.stripPercent = { value: '{{true}}' };

        await entityManager.update(Component, component.id, {
          properties,
        });
        updatedCount++;
      }

      migrationProgress.show();
    }

    return updatedCount;
  }

  /**
   * Removes the key again, restoring the pre-migration state: `stripPercent` exists in no
   * release before this one, so a RangeSliderV2 carrying it got it either from `up()` or
   * from the matching backfill in `app-import-export.service.ts`. Both exist only to serve
   * this flag, so clearing every occurrence is the faithful inverse.
   *
   * Reverting leaves those sliders rendering the `%` in their mark labels — which is the
   * point: without the production change this undoes, nothing reads the key at all.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    const entityManager = queryRunner.manager;
    const totalComponents = await entityManager.count(Component, {
      where: { type: 'RangeSliderV2' },
    });

    if (totalComponents === 0) {
      console.log('BackfillStripPercentRangeSliderV2: no RangeSliderV2 components found.');
      return;
    }

    const migrationProgress = new MigrationProgress('BackfillStripPercentRangeSliderV2 (down)', totalComponents);
    let reverted = 0;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.find(Component, {
          where: { type: 'RangeSliderV2' },
          order: { createdAt: 'ASC' },
          skip,
          take,
        });
      },
      async (entityManager: EntityManager, components: Component[]) => {
        reverted += await this.revertUpdates(entityManager, components, migrationProgress);
      },
      batchSize
    );

    console.log(`BackfillStripPercentRangeSliderV2: reverted. Cleared ${reverted} components.`);
  }

  private async revertUpdates(
    entityManager: EntityManager,
    components: Component[],
    migrationProgress: MigrationProgress
  ): Promise<number> {
    let revertedCount = 0;

    for (const component of components) {
      const properties = component.properties || {};

      if (properties.stripPercent !== undefined) {
        delete properties.stripPercent;

        await entityManager.update(Component, component.id, {
          properties,
        });
        revertedCount++;
      }

      migrationProgress.show();
    }

    return revertedCount;
  }
}
