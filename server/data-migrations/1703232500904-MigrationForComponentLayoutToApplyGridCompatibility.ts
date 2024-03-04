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
          `SELECT id, "left", "type", "top", "width" FROM layouts WHERE id IN (${ids.map((id) => `'${id}'`).join(',')})`
        );
      },
      async (entityManager: EntityManager, layouts: Layout[]) => {
        for (const layout of layouts) {
          const { id, left, type, top, width } = layout;
          const newLeft = this.resolveGridPositionForComponent(left, type);
          await entityManager.update(
            Layout,
            {
              id: id,
            },
            {
              left: newLeft,
              top: type === 'desktop' ? top : top !== 0 ? top - 30 : top,
              width: type === 'desktop' ? width : this.resolveGridPositionForComponent(width, 'mobile'),
            }
          );
        }

        migrationProgress.show();
      },
      batchSize
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private resolveGridPositionForComponent(dimension: number, type: string) {
    const numberOfGrids = type === 'desktop' ? 43 : 12;
    return Math.round((dimension * numberOfGrids) / 100);
  }
}