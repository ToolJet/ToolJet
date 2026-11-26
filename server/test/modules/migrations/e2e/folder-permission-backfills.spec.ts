/**
 * The app-, workflow-, module- and data-source-folder backfills give an existing workspace's admin group
 * exactly what a new workspace gets, on every plan and edition. The reference is the real new-workspace
 * seeding (GroupPermissionsUtilService.createDefaultGroups), not a copy of its constants, so the
 * backfills can't silently drift from it.
 *
 * Builder and end-user groups are the deliberate exceptions. Builders get the folder create/delete flags
 * but no folder granular permission, so on a paid plan a builder doesn't get "Edit folder" on every
 * folder. End-users get nothing: folder access for them comes only through custom groups.
 *
 * @group platform
 */
import { INestApplication } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { initTestApp, closeTestApp, getDefaultDataSource } from 'test-helper';
import { Organization } from '@entities/organization.entity';
import { GroupPermissionsUtilService } from '@modules/group-permissions/util.service';
import { SeedFolderPermissions1766500000001 } from '@migrations/data/1766500000001-SeedFolderPermissions';
import { AddWorkflowFolderGranularPermissionsToExistingAdminGroups1784112436513 } from '@migrations/data/1784112436513-AddWorkflowFolderGranularPermissionsToExistingAdminGroups';
import { AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups1784551394230 } from '@migrations/data/1784551394230-AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups';
import { AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1793250000600 } from '@migrations/data/1793250000600-AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups';

const FOLDER_BACKFILLS = [
  AddWorkflowFolderGranularPermissionsToExistingAdminGroups1784112436513,
  AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups1784551394230,
  AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1793250000600,
];

describe('Folder permission backfills', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  async function newWorkspace(): Promise<string> {
    const slug = `folder-backfill-${uuidv4().slice(0, 8)}`;
    const workspace = await getDefaultDataSource().manager.save(
      getDefaultDataSource().manager.create(Organization, { name: slug, slug })
    );
    await app.get(GroupPermissionsUtilService).createDefaultGroups(workspace.id);
    return workspace.id;
  }

  /** Folder create/delete flags and folder granular permissions of the workspace's default groups. */
  async function folderPermissionsOf(workspaceId: string) {
    return getDefaultDataSource().query(
      `
        SELECT pg.name,
               pg.workflow_folder_create, pg.workflow_folder_delete,
               pg.module_folder_create, pg.module_folder_delete,
               pg.data_source_folder_create, pg.data_source_folder_delete,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'type', gp.type, 'name', gp.name, 'is_all', gp.is_all,
                     'can_edit_folder', fgp.can_edit_folder, 'can_edit_apps', fgp.can_edit_apps,
                     'can_view_apps', fgp.can_view_apps, 'can_run_query', fgp.can_run_query
                   ) ORDER BY gp.type
                 ) FILTER (WHERE gp.id IS NOT NULL),
                 '[]'
               ) AS folder_permissions
        FROM permission_groups pg
        LEFT JOIN granular_permissions gp
          ON gp.group_id = pg.id AND gp.type IN ('workflow_folder', 'module_folder', 'data_source_folder')
        LEFT JOIN folders_group_permissions fgp ON fgp.granular_permission_id = gp.id
        WHERE pg.organization_id = $1 AND pg.type = 'default'
        GROUP BY pg.id
        ORDER BY pg.name
      `,
      [workspaceId]
    );
  }

  /** The state of a workspace created before folder permissions existed. */
  async function removeFolderPermissions(workspaceId: string): Promise<void> {
    const ds = getDefaultDataSource();
    await ds.query(
      `DELETE FROM granular_permissions gp USING permission_groups pg
       WHERE gp.group_id = pg.id AND pg.organization_id = $1 AND pg.type = 'default'
         AND gp.type IN ('workflow_folder', 'module_folder', 'data_source_folder')`,
      [workspaceId]
    );
    await ds.query(
      `UPDATE permission_groups
       SET workflow_folder_create = false, workflow_folder_delete = false,
           module_folder_create = false, module_folder_delete = false,
           data_source_folder_create = false, data_source_folder_delete = false
       WHERE organization_id = $1 AND type = 'default'`,
      [workspaceId]
    );
  }

  /** App-folder granular permissions of the workspace's default groups. */
  async function appFolderPermissionsOf(workspaceId: string) {
    return getDefaultDataSource().query(
      `
        SELECT pg.name,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'name', gp.name, 'is_all', gp.is_all, 'can_edit_folder', fgp.can_edit_folder,
                     'can_edit_apps', fgp.can_edit_apps, 'can_view_apps', fgp.can_view_apps
                   )
                 ) FILTER (WHERE gp.id IS NOT NULL),
                 '[]'
               ) AS folder_permissions
        FROM permission_groups pg
        LEFT JOIN granular_permissions gp ON gp.group_id = pg.id AND gp.type = 'folder'
        LEFT JOIN folders_group_permissions fgp ON fgp.granular_permission_id = gp.id
        WHERE pg.organization_id = $1 AND pg.type = 'default'
        GROUP BY pg.id
        ORDER BY pg.name
      `,
      [workspaceId]
    );
  }

  async function runMigrations(migrations: (new () => { up(queryRunner: QueryRunner): Promise<void> })[]) {
    const queryRunner = getDefaultDataSource().createQueryRunner();
    await queryRunner.connect();
    try {
      for (const Migration of migrations) {
        await new Migration().up(queryRunner);
      }
    } finally {
      await queryRunner.release();
    }
  }

  const runFolderBackfills = () => runMigrations(FOLDER_BACKFILLS);

  describe('on a workspace without folder permissions', () => {
    it('should give the admin group exactly what a new workspace gets', async () => {
      const workspaceId = await newWorkspace();
      const newWorkspacePermissions = await folderPermissionsOf(workspaceId);
      await removeFolderPermissions(workspaceId);

      await runFolderBackfills();

      const admin = (groups: { name: string }[]) => groups.find((group) => group.name === 'admin');
      expect(admin(await folderPermissionsOf(workspaceId))).toEqual(admin(newWorkspacePermissions));
    });

    it('should give end-users no folder flags and no folder granular permission', async () => {
      const workspaceId = await newWorkspace();
      await removeFolderPermissions(workspaceId);

      await runFolderBackfills();

      const endUser = (await folderPermissionsOf(workspaceId)).find((group) => group.name === 'end-user');
      expect(endUser).toMatchObject({
        workflow_folder_create: false,
        workflow_folder_delete: false,
        module_folder_create: false,
        module_folder_delete: false,
        data_source_folder_create: false,
        data_source_folder_delete: false,
        folder_permissions: [],
      });
    });

    it('should give builders the folder create/delete flags but no folder granular permission', async () => {
      const workspaceId = await newWorkspace();
      await removeFolderPermissions(workspaceId);

      await runFolderBackfills();

      const builder = (await folderPermissionsOf(workspaceId)).find((group) => group.name === 'builder');
      expect(builder).toMatchObject({
        workflow_folder_create: true,
        workflow_folder_delete: true,
        module_folder_create: true,
        module_folder_delete: true,
        data_source_folder_create: true,
        data_source_folder_delete: true,
        folder_permissions: [],
      });
    });
  });

  describe('app folders on a workspace without app-folder permissions', () => {
    it('should give only the admin group "Edit folder" on all app folders', async () => {
      const workspaceId = await newWorkspace();
      await getDefaultDataSource().query(
        `DELETE FROM granular_permissions gp USING permission_groups pg
         WHERE gp.group_id = pg.id AND pg.organization_id = $1 AND pg.type = 'default' AND gp.type = 'folder'`,
        [workspaceId]
      );

      await runMigrations([SeedFolderPermissions1766500000001]);

      expect(await appFolderPermissionsOf(workspaceId)).toEqual([
        {
          name: 'admin',
          folder_permissions: [
            { name: 'Folders', is_all: true, can_edit_folder: true, can_edit_apps: false, can_view_apps: false },
          ],
        },
        { name: 'builder', folder_permissions: [] },
        { name: 'end-user', folder_permissions: [] },
      ]);
    });
  });

  describe('on a second run', () => {
    it('should keep folder create/delete flags an admin changed', async () => {
      const workspaceId = await newWorkspace();
      await getDefaultDataSource().query(
        `UPDATE permission_groups
         SET workflow_folder_create = false, module_folder_delete = false, data_source_folder_create = false
         WHERE organization_id = $1 AND name = 'builder' AND type = 'default'`,
        [workspaceId]
      );
      const before = await folderPermissionsOf(workspaceId);

      await runFolderBackfills();

      expect(await folderPermissionsOf(workspaceId)).toEqual(before);
    });
  });
});
