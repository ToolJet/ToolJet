import { MigrationInterface, QueryRunner } from 'typeorm';

// Raw SQL with literals: entities and constants can change after this migration ships.
export class AddWorkflowFolderGranularPermissionsToExistingAdminGroups1784112436513 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [, updatedGroups] = await queryRunner.query(`
      UPDATE permission_groups
      SET workflow_folder_create = true, workflow_folder_delete = true
      WHERE name = 'admin' AND type = 'default'
    `);

    const createdPermissions = await queryRunner.query(`
      WITH new_granular AS (
        INSERT INTO granular_permissions (name, type, group_id, is_all)
        SELECT 'Workflow folders', 'workflow_folder', pg.id, true
        FROM permission_groups pg
        WHERE pg.name = 'admin' AND pg.type = 'default'
          AND NOT EXISTS (
            SELECT 1 FROM granular_permissions gp
            WHERE gp.group_id = pg.id AND gp.type = 'workflow_folder'
          )
        RETURNING id
      )
      INSERT INTO folders_group_permissions (granular_permission_id, can_edit_folder, can_edit_apps, can_view_apps)
      SELECT id, true, false, false FROM new_granular
      RETURNING id
    `);

    console.log(
      `AddWorkflowFolderGranularPermissionsToExistingAdminGroups: [SUCCESS] updated ${updatedGroups} admin groups, created ${createdPermissions.length} granular permissions.`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
