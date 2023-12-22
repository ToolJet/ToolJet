import { Layout } from 'src/entities/layout.entity';
import { MigrationProgress, processDataInBatches } from 'src/helpers/utils.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationForComponentLayoutToApplyGridCompatibility1703232500904 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const allComponentLayouts = await entityManager.query(`
            SELECT id FROM layouts ORDER BY id ASC
    `);

    const totalLayoutsToMigrate = allComponentLayouts?.length;

    const migrationProgress = new MigrationProgress(
      'MigrationForComponentLayoutToApplyGridCompatibility1703232500904',
      totalLayoutsToMigrate
    );

    const batchSize = 100;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        const ids = allComponentLayouts.slice(skip, skip + take).map((page) => page.id);
        if (!ids || ids.length === 0) {
          return [];
        }
        return entityManager.query(
          `SELECT id, "left" FROM layouts WHERE id IN (${ids.map((id) => `'${id}'`).join(',')})`
        );
      },
      async (entityManager: EntityManager, layouts: Layout[]) => {
        for (const layout of layouts) {
          const { id, left } = layout;
          const newLeft = this.resolveGridPositionForComponent(left);
          await entityManager.update(
            Layout,
            {
              id: id,
            },
            {
              left: newLeft,
            }
          );
        }

        migrationProgress.show();
      },
      batchSize
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private resolveGridPositionForComponent(dimension: number) {
    return Math.round((dimension * 43) / 100);
  }
}
