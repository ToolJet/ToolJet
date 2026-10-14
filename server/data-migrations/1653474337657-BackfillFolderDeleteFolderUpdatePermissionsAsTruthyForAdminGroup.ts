import { MigrationInterface, QueryRunner } from 'typeorm';
import { GroupPermission } from '@entities/group_permission.entity';

export class BackfillFolderDeleteFolderUpdatePermissionsAsTruthyForAdminGroup1653474337657 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { folderUpdate: true, folderDelete: true });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { folderUpdate: false, folderDelete: false });
  }
}
