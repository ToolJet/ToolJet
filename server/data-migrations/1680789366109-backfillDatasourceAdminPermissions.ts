import { GroupPermission } from '@entities/group_permission.entity';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { getTooljetEdition } from '@helpers/utils.helper';

export class backfillDatasourceAdminPermissions1680789366109 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() === TOOLJET_EDITIONS.CE) {
      return;
    }
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { dataSourceCreate: true, dataSourceDelete: true });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() === TOOLJET_EDITIONS.CE) {
      return;
    }
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { dataSourceCreate: false, dataSourceDelete: false });
  }
}
