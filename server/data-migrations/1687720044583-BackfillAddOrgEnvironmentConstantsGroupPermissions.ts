import { MigrationInterface, QueryRunner } from 'typeorm';
import { GroupPermission } from '../src/entities/group_permission.entity';

export class BackfillAddOrgEnvironmentConstantsGroupPermissions1687720044583 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update(
      { group: 'admin' },
      { orgEnvironmentConstantCreate: true, orgEnvironmentConstantDelete: true }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepository = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepository.update(
      { group: 'admin' },
      { orgEnvironmentConstantCreate: false, orgEnvironmentConstantDelete: false }
    );
  }
}
