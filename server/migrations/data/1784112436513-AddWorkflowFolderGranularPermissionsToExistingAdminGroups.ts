import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'AddWorkflowFolderGranularPermissionsToExistingAdminGroups1784112436513';
const RESOURCE_TYPE = 'workflow_folder';
const PERMISSION_NAME = 'Workflow folders';

// Copied as literals: the group-permission constants can change after this ships.
// Builders get the create/delete flags only, never a folder granular permission: an is_all "Edit folder"
// row would let every builder edit every folder on a paid plan. Admins grant builders folder access
// through custom groups. On a free plan the rows are never read (hardcoded role), so this changes nothing there.
const SEEDS = [
  { roles: ['admin'], setCreateDelete: true, folderPermission: { canEditFolder: true, canViewApps: false } },
  { roles: ['builder'], setCreateDelete: true, folderPermission: null },
  { roles: ['end-user'], setCreateDelete: false, folderPermission: { canEditFolder: false, canViewApps: true } },
];

/**
 * Gives the default groups of every existing workspace workflow-folder permissions, on every plan and
 * edition:
 * - admin: workflow_folder_create/delete = true and "Edit folder" on all workflow folders
 * - builder: workflow_folder_create/delete = true only. No granular permission, so on a paid plan a builder
 *   manages the folders they create and gets more only through a custom group.
 * - end-user: "View" on all workflow folders
 *
 * No licence check. On a restricted plan or with custom groups off, EE resolves permissions from a
 * hardcoded role and never reads these rows. Custom groups are never touched.
 *
 * Idempotent: a group that already has a workflow_folder granular permission is skipped, flags
 * included, so a re-run keeps whatever an admin changed since.
 *
 * The other two folder backfills use the same rule:
 * 1784551394230-AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups,
 * 1793250000600-AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups.
 */
export class AddWorkflowFolderGranularPermissionsToExistingAdminGroups1784112436513 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT count(*)::int AS total FROM permission_groups pg
       WHERE pg.type = 'default' AND pg.name = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM granular_permissions gp WHERE gp.group_id = pg.id AND gp.type = '${RESOURCE_TYPE}')`,
      [SEEDS.flatMap((seed) => seed.roles)]
    );
    console.log(`${MIGRATION_NAME}: [START] Seeding workflow-folder permissions on default groups: ${total}`);

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
            SET workflow_folder_create = true, workflow_folder_delete = true
            WHERE $2::boolean AND id IN (SELECT id FROM targets)
          ),
          new_granular AS (
            INSERT INTO granular_permissions (name, type, group_id, is_all)
            SELECT '${PERMISSION_NAME}', '${RESOURCE_TYPE}', id, true FROM targets WHERE $3::boolean
            RETURNING id
          ),
          new_folder_permissions AS (
            INSERT INTO folders_group_permissions (granular_permission_id, can_edit_folder, can_edit_apps, can_view_apps)
            SELECT id, $4::boolean, false, $5::boolean FROM new_granular
          )
          SELECT count(*)::int AS groups FROM targets
        `,
        [
          seed.roles,
          seed.setCreateDelete,
          seed.folderPermission !== null,
          seed.folderPermission?.canEditFolder ?? false,
          seed.folderPermission?.canViewApps ?? false,
        ]
      );
      seeded += rows[0].groups;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${seeded}/${total} (${seed.roles.join(', ')})`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Seeding workflow-folder permissions finished. Seeded: ${seeded}`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Not reversible: the seeded rows can't be told apart from ones an admin created or edited since.
  }
}
