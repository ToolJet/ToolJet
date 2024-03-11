import { Layout } from 'src/entities/layout.entity';
import { MigrationProgress, processDataInBatches } from 'src/helpers/utils.helper';
import { EntityManager, In, MigrationInterface, QueryRunner } from 'typeorm';

export class BackFillLayoutDimensionUnit1709615280120 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const layouts = await entityManager.query(`
            SELECT id FROM layouts
    `);

    const totalPages = layouts?.length;

    const migrationProgress = new MigrationProgress('BackFillLayoutDimensionUnit1709615280120', totalPages);

    const batchSize = 100;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        const ids = layouts.slice(skip, skip + take).map((page) => page.id);
        if (!ids || ids.length === 0) {
          return [];
        }
        return entityManager.query(
          `SELECT id, dimension_unit FROM layouts WHERE id IN (${ids.map((id) => `'${id}'`).join(',')})`
        );
      },
      async (entityManager: EntityManager, layouts: Layout[]) => {
        await entityManager.update(
          Layout,
          {
            id: In(layouts.map((page) => page.id)),
          },
          {
            dimensionUnit: 'percent',
          }
        );

        migrationProgress.show();
      },
      batchSize
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
