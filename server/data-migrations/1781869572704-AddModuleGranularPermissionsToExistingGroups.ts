import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { ResourceType } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { dbTransactionWrap } from '@helpers/database.helper';

/**
 * Backfills a module granular permission for every existing default `admin` and `builder` group so
 * the introduction of module-scoped permissions does not regress current behaviour (where any builder
 * could edit/use any module). Admin + builder get isAll + Edit (can_edit) + Build-with (can_view);
 * custom groups are left empty and configured explicitly by admins.
 *
 * Template: AddWorkflowGranularPermissionsToExistingAdminGroups1758009004418.
 */
export class AddModuleGranularPermissionsToExistingGroups1781869572704 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    return dbTransactionWrap(async (manager: EntityManager) => {
      const organizationsCount = await manager.count('organizations');
      if (organizationsCount === 0) {
        console.log('No organizations found, skipping migration.');
        return;
      }

      // Default admin + builder groups across all organizations
      const groups = await manager.query(`
        SELECT id, organization_id, name
        FROM permission_groups
        WHERE name IN ('admin', 'builder') AND type = 'default'
      `);

      console.log(`[START] Add module granular permissions | Total: ${groups.length}`);

      let processed = 0;
      for (const group of groups) {
        const { id: groupId } = group;

        const existingPermission = await manager.find(GranularPermissions, {
          where: { groupId, type: ResourceType.MODULE },
        });

        if (existingPermission.length > 0) {
          processed++;
          continue;
        }

        const granularPermissions = await manager.save(
          manager.create(GranularPermissions, {
            name: DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.MODULE],
            type: ResourceType.MODULE,
            groupId,
            isAll: true,
          })
        );

        await manager.save(
          manager.create(AppsGroupPermissions, {
            granularPermissionId: granularPermissions.id,
            canEdit: true,
            canView: false,
            hideFromDashboard: false,
            appType: APP_TYPES.MODULE,
          })
        );

        processed++;
        console.log(`[PROGRESS] ${processed}/${groups.length} (${Math.round((processed / groups.length) * 100)}%)`);
      }

      console.log('[SUCCESS] Add module granular permissions finished.');
    }, manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
