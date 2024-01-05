import { Page } from 'src/entities/page.entity';
import { MigrationProgress, processDataInBatches } from 'src/helpers/utils.helper';
import { EntityManager, In, MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillAutoComputeLayout1703230364205 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const pages = await entityManager.query(`
            SELECT id FROM pages ORDER BY created_at ASC
    `);

    const totalPages = pages?.length;

    const migrationProgress = new MigrationProgress('BackfillAutoComputeLayout1703230364205', totalPages);

    const batchSize = 100;

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        const ids = pages.slice(skip, skip + take).map((page) => page.id);
        if (!ids || ids.length === 0) {
          return [];
        }
        return entityManager.query(
          `SELECT id, auto_compute_layout FROM pages WHERE id IN (${ids.map((id) => `'${id}'`).join(',')})`
        );
      },
      async (entityManager: EntityManager, pages: Page[]) => {
        await entityManager.update(
          Page,
          {
            id: In(pages.map((page) => page.id)),
          },
          {
            autoComputeLayout: false,
          }
        );

        migrationProgress.show();
      },
      batchSize
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
