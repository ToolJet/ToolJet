import { Folder } from 'src/entities/folder.entity';
import { EntityManager, MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class AddUniqueConstraintToFolderName1684145489093 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.migrateFolderNames(entityManager);
    await queryRunner.createUniqueConstraint(
      'folders',
      new TableUnique({
        name: 'folder_name_organization_id_unique',
        columnNames: ['name', 'organization_id'],
      })
    );
  }

  public async migrateFolderNames(entityManager: EntityManager) {
    const folders = await entityManager.query(
      'select sub_query.name from (select count(*) as name_count, name from folders group by name) sub_query where name_count > 1    '
    );
    for (const folder of folders) {
      const { name } = folder;
      const sameFolders = await entityManager.find(Folder, { name });
      for (const folderToChange of sameFolders.slice(1)) {
        await entityManager.update(Folder, { id: folderToChange.id }, { name: `${folderToChange.name}_${Date.now()}` });
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
