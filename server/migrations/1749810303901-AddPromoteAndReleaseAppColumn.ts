import { GroupPermissions } from '@entities/group_permissions.entity';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPromoteAndReleaseAppColumn1749810303901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner?.manager;
    await queryRunner.addColumns('permission_groups', [
      new TableColumn({
        name: 'app_promote',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'app_release',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    ]);

    const permissionGroups = await manager.find(GroupPermissions);

    for (const group of permissionGroups) {
      const { name, type, appCreate, appDelete } = group;
      const hasAppPermissions = appCreate === true || appDelete === true;

      // For custom groups and builders :
      // If the group has  -> app create || app delete permissions  : assign promote and release permissions to the group otherwise false
      if (type === 'default') {
        switch (name) {
          case 'admin':
            group.appPromote = true;
            group.appRelease = true;
            break;
          case 'end-user':
            group.appPromote = false;
            group.appRelease = false;
            break;
          case 'builder':
            group.appPromote = hasAppPermissions;
            group.appRelease = hasAppPermissions;
            break;
          default:
            break;
        }
      } else if (type === 'custom') {
        group.appPromote = hasAppPermissions;
        group.appRelease = hasAppPermissions;
      }

      await manager.save(group);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
// TO Do later : pending to add constraint on admin and end user groups
