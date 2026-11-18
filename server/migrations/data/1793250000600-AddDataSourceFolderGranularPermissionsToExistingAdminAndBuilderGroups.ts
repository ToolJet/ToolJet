import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1793250000600';
const RESOURCE_TYPE = 'data_source_folder';
const PERMISSION_NAME = 'Data source folders';

// What a new workspace's default groups get (DEFAULT_GROUP_PERMISSIONS + DEFAULT_RESOURCE_PERMISSIONS in
// src/modules/group-permissions/constants). Copied as literals: those constants can change after this ships.
// end_user gets nothing: data-source folders are never end-user assignable.
const SEEDS = [{ roles: ['admin', 'builder'], setCreateDelete: true, canEditFolder: true, canViewApps: false }];

/**
 * Gives the default groups of every existing workspace the data-source-folder permissions a new
 * workspace gets, on every plan and edition:
 * - admin, builder: data_source_folder_create/delete = true and "Edit folder" on all data-source
 *   folders (the ability layer cascades that to configure/build-with on the folders' data sources)
 * - end_user: nothing
 *
 * No licence check. On a restricted plan or with custom groups off, EE resolves permissions from a
 * hardcoded role and never reads these rows, so they grant nothing there. They take effect if the
 * workspace later gets custom groups, the same as for a new workspace. CE always reads the rows,
 * and gets what a new CE workspace gets. Custom groups are never touched.
 *
 * Idempotent: a group that already has a data_source_folder granular permission is skipped, flags
 * included, so a re-run keeps whatever an admin changed since.
 *
 * The other two folder backfills use the same rule:
 * 1784112436513-AddWorkflowFolderGranularPermissionsToExistingAdminGroups,
 * 1784551394230-AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups.
 */
export class AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1793250000600 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT count(*)::int AS total FROM permission_groups pg
       WHERE pg.type = 'default' AND pg.name = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM granular_permissions gp WHERE gp.group_id = pg.id AND gp.type = '${RESOURCE_TYPE}')`,
      [SEEDS.flatMap((seed) => seed.roles)]
    );
    console.log(`${MIGRATION_NAME}: [START] Seeding data-source-folder permissions on default groups: ${total}`);

    let seeded = 0;
    for (const seed of SEEDS) {
      const rows = await queryRunner.query(
        `
          WITH targets AS (
            SELECT pg.id FROM permission_groups pg
            WHERE pg.type = 'default' AND pg.name = ANY($1)
              AND NOT EXISTS (
                SELECT 1 FROM granular_permissions gp WHERE gp.group_id = pg.id AND gp.type = '${RESOURCE_TYPE}'
              )
          ),
          flags AS (
            UPDATE permission_groups
            SET data_source_folder_create = true, data_source_folder_delete = true
            WHERE $2::boolean AND id IN (SELECT id FROM targets)
          ),
          new_granular AS (
            INSERT INTO granular_permissions (name, type, group_id, is_all)
            SELECT '${PERMISSION_NAME}', '${RESOURCE_TYPE}', id, true FROM targets
            RETURNING id
          )
          INSERT INTO folders_group_permissions (granular_permission_id, can_edit_folder, can_edit_apps, can_view_apps)
          SELECT id, $3::boolean, false, $4::boolean FROM new_granular
          RETURNING id
        `,
        [seed.roles, seed.setCreateDelete, seed.canEditFolder, seed.canViewApps]
      );
      seeded += rows.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${seeded}/${total} (${seed.roles.join(', ')})`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Seeding data-source-folder permissions finished. Seeded: ${seeded}`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // One-way: the seeded permissions match what new workspaces get, and admins may have edited them
    // since. The schema migration's down() drops the coarse columns.
  }
}
