import { GroupPermissions } from '@entities/group_permissions.entity';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPromoteAndReleaseAppColumn1749810303901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner?.manager;
    await queryRunner.addColumns('permission_groups', [
      new TableColumn({
        name: 'promote_app',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'release_app',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    ]);

    const permissionGroups = await manager.find(GroupPermissions);

    for (const group of permissionGroups) {
      const { name, type, appCreate, appDelete } = group;
      const hasAppPermissions = appCreate === true || appDelete;

      // For custom groups and builders :
      // If the group has  -> app create || app delete permissions  : assign promote and release permissions to the group otherwise false
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
