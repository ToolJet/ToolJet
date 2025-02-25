import { GroupPermission } from '@entities/group_permission.entity';
import { EDITIONS } from '@modules/app/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { getEnvVars } from '../scripts/database-config-utils';

export class backfillDatasourceAdminPermissions1680789366109 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    if (!envData.EDITION || envData.EDITION === EDITIONS.CE) {
      return;
    }
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { dataSourceCreate: true, dataSourceDelete: true });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    if (!envData.EDITION || envData.EDITION === EDITIONS.CE) {
      return;
    }
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update({ group: 'admin' }, { dataSourceCreate: false, dataSourceDelete: false });
  }
}
