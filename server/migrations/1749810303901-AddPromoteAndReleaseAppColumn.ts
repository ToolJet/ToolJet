import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPromoteAndReleaseAppColumn1749810303901 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

    // Using raw SQL instead of entity queries to avoid dependency on current entity schema
    const permissionGroups = await queryRunner.query(`
      SELECT id, name, type, app_create, app_delete 
      FROM permission_groups
    `);

    for (const group of permissionGroups) {
      const { id, name, type, app_create, app_delete } = group;
      const hasAppPermissions = app_create === true || app_delete === true;

      let appPromote = false;
      let appRelease = false;

      // For custom groups and builders :
      // If the group has  -> app create || app delete permissions  : assign promote and release permissions to the group otherwise false
      if (type === 'default') {
        switch (name) {
          case 'admin':
            appPromote = true;
            appRelease = true;
            break;
          case 'end-user':
            appPromote = false;
            appRelease = false;
            break;
          case 'builder':
            appPromote = hasAppPermissions;
            appRelease = hasAppPermissions;
            break;
          default:
            break;
        }
      } else if (type === 'custom') {
        appPromote = hasAppPermissions;
        appRelease = hasAppPermissions;
      }

      await queryRunner.query(`
        UPDATE permission_groups 
        SET app_promote = $1, app_release = $2 
        WHERE id = $3
      `, [appPromote, appRelease, id]);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
// TO Do later : pending to add constraint on admin and end user groups
