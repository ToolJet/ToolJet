import { MigrationInterface, QueryRunner } from 'typeorm';
import { ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';

const MIGRATION_NAME = 'AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1787200000000';

/**
 * Backfills data-source-folder permissions on the admin, builder AND end-user default groups of
 * every existing org, on ALL plans (mirrors how new orgs are seeded in
 * GranularPermissionsUtilService). Role-specific:
 * - admin / builder: coarse create+delete true + a granular DATA_SOURCE_FOLDER permission with
 *   canEditFolder true (which the ability layer cascades to configure/build-with on the folder's
 *   data sources).
 * - end_user: coarse create+delete false + a granular permission with canEditFolder/canEditApps/
 *   canViewApps all false (all non-editable in the UI). Only "restrict query run"
 *   (folders_group_permissions.can_run_query, default true = open, enforced at query-execution time)
 *   is meaningful/editable for end users.
 * - custom groups are never touched (queries scoped to type = 'default').
 *
 * Idempotent: skips any group that already has a DATA_SOURCE_FOLDER granular permission, and the
 * coarse-column update is a plain set. Runs under migrationsTransactionMode 'all', so all DB work
 * goes through queryRunner.manager (the shared batch transaction).
 */
export class AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1787200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    // Role → seed values. Admin/builder manage folders; end-user only carries the query-run control.
    const ROLE_SEED: Record<string, { coarse: boolean; canEditFolder: boolean }> = {
      [USER_ROLE.ADMIN]: { coarse: true, canEditFolder: true },
      [USER_ROLE.BUILDER]: { coarse: true, canEditFolder: true },
      [USER_ROLE.END_USER]: { coarse: false, canEditFolder: false },
    };
    const roleNames = [USER_ROLE.ADMIN, USER_ROLE.BUILDER, USER_ROLE.END_USER];

    const organizations = await manager.query(`SELECT id FROM organizations`);
    if (organizations.length === 0) {
      console.log(`${MIGRATION_NAME}: No organizations found, skipping migration.`);
      return;
    }
    console.log(`${MIGRATION_NAME}: [START] Seeding data-source-folder permissions: ${organizations.length}`);

    let processed = 0;
    for (const { id: organizationId } of organizations) {
      const groups = await manager.query(
        `
          SELECT id, name
          FROM permission_groups
          WHERE organization_id = $1 AND name = ANY($2) AND type = 'default'
        `,
        [organizationId, roleNames]
      );

      for (const group of groups) {
        const { id: groupId, name } = group;
        const seed = ROLE_SEED[name];
        if (!seed) continue;

        await manager.query(
          `
            UPDATE permission_groups
            SET data_source_folder_create = $2, data_source_folder_delete = $2
            WHERE id = $1
          `,
          [groupId, seed.coarse]
        );

        const existingPermission = await manager.find(GranularPermissions, {
          where: { groupId, type: ResourceType.DATA_SOURCE_FOLDER },
        });
        if (existingPermission.length > 0) {
          console.log(
            `${MIGRATION_NAME}: Data-source-folder permission already exists for group ${groupId}, skipping.`
          );
          continue;
        }

        const granularPermissions = manager.create(GranularPermissions, {
          name: DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.DATA_SOURCE_FOLDER],
          type: ResourceType.DATA_SOURCE_FOLDER,
          groupId,
          isAll: true,
        });
        const savedGranularPermissions = await manager.save(granularPermissions);

        const foldersGroupPermissions = manager.create(FoldersGroupPermissions, {
          granularPermissionId: savedGranularPermissions.id,
          canEditFolder: seed.canEditFolder,
          canEditApps: false,
          canViewApps: false,
        });
        await manager.save(foldersGroupPermissions);
      }

      processed++;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${processed}/${organizations.length}`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Seeding data-source-folder permissions finished.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
