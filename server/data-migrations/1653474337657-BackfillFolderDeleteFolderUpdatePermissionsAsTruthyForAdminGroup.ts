import { MigrationInterface, QueryRunner } from 'typeorm';
import { GroupPermission } from '../src/entities/group_permission.entity';

export class BackfillFolderDeleteFolderUpdatePermissionsAsTruthyForAdminGroup1653474337657
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepostory = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepostory.update({ group: 'admin' }, { folderUpdate: true, folderDelete: true });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepostory = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepostory.update({ group: 'admin' }, { folderUpdate: false, folderDelete: false });
  }
}
