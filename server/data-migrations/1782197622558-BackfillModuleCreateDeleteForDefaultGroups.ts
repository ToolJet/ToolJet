import { MigrationInterface, QueryRunner } from 'typeorm';
import { In } from 'typeorm';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';

/**
 * Backfills module_create=true and module_delete=true for all existing default admin and builder
 * groups so that the introduction of per-group module_create/module_delete flags does not regress
 * current behaviour (where any admin or builder could create and delete modules).
 */
export class BackfillModuleCreateDeleteForDefaultGroups1782197622558 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const GroupPermissionRepository = queryRunner.manager.getRepository(GroupPermissions);

    await GroupPermissionRepository.update(
      { type: GROUP_PERMISSIONS_TYPE.DEFAULT, name: In(['admin', 'builder']) },
      { moduleCreate: true, moduleDelete: true }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const GroupPermissionRepository = queryRunner.manager.getRepository(GroupPermissions);

    await GroupPermissionRepository.update(
      { type: GROUP_PERMISSIONS_TYPE.DEFAULT, name: In(['admin', 'builder']) },
      { moduleCreate: false, moduleDelete: false }
    );
  }
}
