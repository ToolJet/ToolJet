import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { ResourceType } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { dbTransactionWrap } from '@helpers/database.helper';

export class AddWorkflowFolderGranularPermissionsToExistingAdminGroups1784112436513 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    return dbTransactionWrap(async (manager: EntityManager) => {
      const organizationsCount = await manager.count('organizations');
      if (organizationsCount === 0) {
        console.log('No organizations found, skipping migration.');
        return;
      }

      // Get all existing admin groups
      const adminGroups = await manager.query(`
      SELECT id, organization_id
      FROM permission_groups
      WHERE name = 'admin' AND type = 'default'
    `);

      console.log(`Found ${adminGroups.length} admin groups to update with workflow folder granular permissions.`);

      for (const group of adminGroups) {
        const { id: groupId } = group;

        await manager.query(
          `
        UPDATE permission_groups
        SET workflow_folder_create = true, workflow_folder_delete = true
        WHERE id = $1
      `,
          [groupId]
        );

        // Check if workflow folder granular permission already exists
        const existingPermission = await manager.find(GranularPermissions, {
          where: { groupId, type: ResourceType.WORKFLOW_FOLDER },
        });

        if (existingPermission.length > 0) {
          console.log(`Workflow folder granular permission already exists for group ${groupId}, skipping.`);
          continue;
        }

        const granularPermissions = manager.create(GranularPermissions, {
          name: DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.WORKFLOW_FOLDER],
          type: ResourceType.WORKFLOW_FOLDER,
          groupId,
          isAll: true,
        });

        const savedGranularPermissions = await manager.save(granularPermissions);

        const foldersGroupPermissions = manager.create(FoldersGroupPermissions, {
          granularPermissionId: savedGranularPermissions.id,
          canEditFolder: true,
          canEditApps: false,
          canViewApps: false,
        });

        await manager.save(foldersGroupPermissions);

        console.log(
          `Created workflow folder granular permission and folders group permission for admin group ${groupId}`
        );
      }

      console.log('Successfully added workflow folder granular permissions to all existing admin groups.');
    }, manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
