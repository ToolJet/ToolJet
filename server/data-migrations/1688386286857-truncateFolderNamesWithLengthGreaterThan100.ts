import { MigrationInterface, QueryRunner, EntityManager } from 'typeorm';
import { Folder } from 'src/entities/folder.entity';

export class TruncateFolderNamesWithLengthGreaterThan1001688386286857 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.truncateFolderNames(entityManager);
  }

  public async truncateFolderNames(entityManager: EntityManager) {
    const folders = await entityManager.find(Folder, {
      where: 'LENGTH(name) > 100',
    });

    for (const folder of folders) {
      folder.name = folder.name.substring(0, 100);
    }

    await entityManager.save(folders);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
