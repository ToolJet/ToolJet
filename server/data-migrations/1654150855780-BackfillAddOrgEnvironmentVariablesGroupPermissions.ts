import { MigrationInterface, QueryRunner } from 'typeorm';
import { GroupPermission } from '../src/entities/group_permission.entity';

export class BackfillAddOrgEnvironmentVariablesGroupPermissions1654150855780 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepostory = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepostory.update(
      { group: 'admin' },
      { orgEnvironmentVariableCreate: true, orgEnvironmentVariableDelete: true, orgEnvironmentVariableUpdate: true }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepostory = entityManager.getRepository(GroupPermission);

    await GroupPermissionRepostory.update(
      { group: 'admin' },
      { orgEnvironmentVariableCreate: false, orgEnvironmentVariableDelete: false, orgEnvironmentVariableUpdate: false }
    );
  }
}
