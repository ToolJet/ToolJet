import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { ResourceType } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { dbTransactionWrap } from '@helpers/database.helper';

export class AddWorkflowGranularPermissionsToExistingAdminGroups1758009004418 implements MigrationInterface {
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

      console.log(`Found ${adminGroups.length} admin groups to update with workflow granular permissions.`);

      for (const group of adminGroups) {
        const { id: groupId } = group;

        // Check if workflow granular permission already exists
        const existingPermission = await manager.find(GranularPermissions, {
          where: { groupId, type: ResourceType.WORKFLOWS },
        });

        if (existingPermission.length > 0) {
          console.log(`Workflow granular permission already exists for group ${groupId}, skipping.`);
          continue;
        }

        const granularPermissions = manager.create(GranularPermissions, {
          name: DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.WORKFLOWS],
          type: ResourceType.WORKFLOWS,
          groupId,
          isAll: true,
        });

        const savedGranularPermissions = await manager.save(granularPermissions);

        const appsGroupPermissions = manager.create(AppsGroupPermissions, {
          granularPermissionId: savedGranularPermissions.id,
          canEdit: true,
          canView: false,
          hideFromDashboard: false,
          appType: APP_TYPES.WORKFLOW,
        });

        await manager.save(appsGroupPermissions);

        console.log(`Created workflow granular permission and apps group permission for admin group ${groupId}`);
      }

      console.log('Successfully added workflow granular permissions to all existing admin groups.');
    }, manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
