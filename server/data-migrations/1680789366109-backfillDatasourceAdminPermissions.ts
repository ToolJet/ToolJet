import { GroupPermission } from '@entities/group_permission.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class backfillDatasourceAdminPermissions1680789366109 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { dataSourceCreate: true, dataSourceDelete: true });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { dataSourceCreate: false, dataSourceDelete: false });
  }
}
