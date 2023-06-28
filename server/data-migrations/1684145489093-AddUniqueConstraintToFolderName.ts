import { Folder } from 'src/entities/folder.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner, TableUnique } from 'typeorm';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { addWait } from 'src/helpers/migration.helper';

export class AddUniqueConstraintToFolderName1684145489093 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await this.migrateFolderNames(entityManager);
    await queryRunner.createUniqueConstraint(
      'folders',
      new TableUnique({
        name: DataBaseConstraints.FOLDER_NAME_UNIQUE,
        columnNames: ['name', 'organization_id'],
      })
    );
  }

  public async migrateFolderNames(entityManager: EntityManager) {
    const workspaces = await entityManager.find(Organization);
    for (const workspace of workspaces) {
      const { id: organizationId } = workspace;
      const folders = await entityManager.query(
        'select sub_query.name from (select count(*) as name_count, name from folders where organization_id=$1 group by name) sub_query where name_count > 1    ',
        [organizationId]
      );
      for (const folder of folders) {
        const { name } = folder;
        const sameFolders = await entityManager.find(Folder, { where: { name, organizationId } });
        for (const folderToChange of sameFolders.slice(1)) {
          await entityManager.update(
            Folder,
            { id: folderToChange.id },
            { name: `${folderToChange.name} ${Date.now()}` }
          );
          // Add 1 millisecond wait to prevent duplicate timestamp generation
          addWait(1);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
