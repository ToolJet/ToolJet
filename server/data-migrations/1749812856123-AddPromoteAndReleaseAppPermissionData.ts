import { GroupPermissions } from '@entities/group_permissions.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromoteAndReleaseAppPermissionData1749812856123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner?.manager;

    const permissionGroups = await manager.find(GroupPermissions);

    for (const group of permissionGroups) {
      const { name, type, appCreate, appDelete } = group;
      const hasAppPermissions = appCreate === true || appDelete;

      // For custom groups and builders :
      // If the group has  -> app create || app delete permissions  : assign promote and release permissions to the group otherwise false

      // Handle
      if (type === 'default') {
        switch (name) {
          case 'admin':
            group.promoteApp = true;
            group.releaseApp = true;
            break;
          case 'end-user':
            group.promoteApp = false;
            group.releaseApp = false;
            break;
          case 'builder':
            group.promoteApp = hasAppPermissions;
            group.releaseApp = hasAppPermissions;
            break;
          default:
            break;
        }
      } else if (type === 'custom') {
        group.promoteApp = hasAppPermissions;
        group.releaseApp = hasAppPermissions;
      }

      await manager.save(group);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
// TO Do later : pending to add constraint on admin and end user groups
