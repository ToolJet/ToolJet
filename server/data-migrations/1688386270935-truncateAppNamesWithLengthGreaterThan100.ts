import { MigrationInterface, QueryRunner, EntityManager } from 'typeorm';
import { App } from 'src/entities/app.entity';

export class TruncateAppNamesWithLengthGreaterThan1001688386270935 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.truncateAppNames(entityManager);
  }

  public async truncateAppNames(entityManager: EntityManager) {
    const apps = await entityManager.find(App, {
      where: 'LENGTH(name) > 100',
    });

    for (const app of apps) {
      app.name = app.name.substring(0, 100);
    }

    await entityManager.save(apps);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
