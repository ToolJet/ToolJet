import { MigrationInterface, QueryRunner } from 'typeorm';
import { GroupPermission } from '../src/entities/group_permission.entity';

export class BackfillFolderCreatePermissionsAsTruthyForMissedAdminGroup1638796825499 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin', folderCreate: false }, { folderCreate: true });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { folderCreate: false });
  }
}
