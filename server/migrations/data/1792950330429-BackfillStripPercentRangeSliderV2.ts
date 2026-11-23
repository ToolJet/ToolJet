import {
  MigrationProgress,
  deleteAppHistoryForStructuralMigration,
  processDataInBatches,
} from '@helpers/migration.helper';
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
    const updatedComponentIds: string[] = [];

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.find(Component, {
          where: { type: 'RangeSliderV2' },
          // `id` breaks ties: created_at defaults to now(), the TRANSACTION timestamp, so every
          // component inserted by one app create or import shares it. Offset pagination over a
          // non-unique sort key lets Postgres return a different permutation per batch, which
          // repeats some rows and skips others — and a skipped slider never gets the flag.
          order: { createdAt: 'ASC', id: 'ASC' },
          skip,
          take,
        });
      },
      async (entityManager: EntityManager, components: Component[]) => {
        // Spread is safe: `processUpdates` returns at most one batch (100) of ids.
        updatedComponentIds.push(...(await this.processUpdates(entityManager, components, migrationProgress)));
      },
      batchSize
    );

    // A snapshot taken before this ran carries no `stripPercent`, so restoring an app to one
    // would put the pre-fix mark labels straight back onto components this just corrected.
    // Same reason BackfillTooltipFormat and BackfillCollapseWhenHiddenForRemainingComponents
    // clear theirs. The helper resolves the affected app versions from these component ids.
    if (updatedComponentIds.length > 0) {
      await deleteAppHistoryForStructuralMigration(
        entityManager,
        { componentIds: updatedComponentIds },
        'BackfillStripPercentRangeSliderV2'
      );
    }

    console.log(`BackfillStripPercentRangeSliderV2: completed. Updated ${updatedComponentIds.length} components.`);
  }

  private async processUpdates(
    entityManager: EntityManager,
    components: Component[],
    migrationProgress: MigrationProgress
  ): Promise<string[]> {
    const updatedIds: string[] = [];

    for (const component of components) {
      const properties = component.properties || {};

      if (properties.stripPercent === undefined) {
        properties.stripPercent = { value: '{{true}}' };

        await entityManager.update(Component, component.id, {
          properties,
        });
        updatedIds.push(component.id);
      }

      migrationProgress.show();
    }

    return updatedIds;
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
          // `id` breaks ties: created_at defaults to now(), the TRANSACTION timestamp, so every
          // component inserted by one app create or import shares it. Offset pagination over a
          // non-unique sort key lets Postgres return a different permutation per batch, which
          // repeats some rows and skips others — and a skipped slider never gets the flag.
          order: { createdAt: 'ASC', id: 'ASC' },
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
