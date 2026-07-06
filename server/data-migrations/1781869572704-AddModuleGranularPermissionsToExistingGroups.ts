import { MigrationInterface, QueryRunner } from 'typeorm';
import { ResourceType } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { APP_TYPES } from '@modules/apps/constants';

/**
 * Backfills a module granular permission for every existing default `admin` and `builder` group so
 * the introduction of module-scoped permissions does not regress current behaviour (where any builder
 * could edit/use any module). Admin + builder get isAll + Edit (can_edit) + Build-with (can_view);
 * custom groups are left empty and configured explicitly by admins.
 *
 * Template: AddWorkflowGranularPermissionsToExistingAdminGroups1758009004418 — reimplemented as a
 * set-based INSERT...SELECT to avoid a per-group round trip loop at cloud scale.
 */
export class AddModuleGranularPermissionsToExistingGroups1781869572704 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const organizationsCount = await queryRunner.manager.count('organizations');
    if (organizationsCount === 0) {
      return;
    }

    await queryRunner.query(
      `
      WITH inserted_permissions AS (
        INSERT INTO granular_permissions (group_id, name, type, is_all)
        SELECT pg.id, $1, $2, true
        FROM permission_groups pg
        WHERE pg.name IN ('admin', 'builder') AND pg.type = 'default'
          AND NOT EXISTS (
            SELECT 1 FROM granular_permissions gp WHERE gp.group_id = pg.id AND gp.type = $2
          )
        RETURNING id
      )
      INSERT INTO apps_group_permissions (granular_permission_id, app_type, can_edit, can_view, hide_from_dashboard)
      SELECT id, $3, true, false, false FROM inserted_permissions
      `,
      [DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.MODULE], ResourceType.MODULE, APP_TYPES.MODULE]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
