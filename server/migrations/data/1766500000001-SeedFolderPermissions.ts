import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFolderPermissions1766500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create granular_permissions entries for app folders — ONLY for the DEFAULT admin group.
    // Custom groups must NOT get any permission added automatically on migration; a folder (App folders)
    // permission is granted to a custom group only when an admin explicitly configures it.
    // Builder groups get no folder permission: an is_all "Edit folder" row would let every builder edit
    // every app folder on a paid plan. Builders manage the folders they create, and get more only through
    // a custom group. End-user groups get none either: their app permission already decides which apps they
    // see, and folder access for them comes only through custom groups.
    // Free plans never read these rows (hardcoded role).
    await queryRunner.query(`
      INSERT INTO granular_permissions (group_id, name, type, is_all)
      SELECT
        pg.id as group_id,
        'Folders' as name,
        'folder'::resource_type as type,
        true as is_all
      FROM permission_groups pg
      WHERE pg.type = 'default'
      AND pg.name = 'admin'
      AND NOT EXISTS (
        SELECT 1 FROM granular_permissions gp
        WHERE gp.group_id = pg.id AND gp.type = 'folder'
      );
    `);

    // Step 2: Admin groups get "Edit folder" (highest level) on each new granular permission.
    // Radio button approach: only the selected permission level is true
    // Implied permissions (edit apps, view apps) are derived at runtime
    await queryRunner.query(`
      INSERT INTO folders_group_permissions (granular_permission_id, can_edit_folder, can_edit_apps, can_view_apps)
      SELECT
        gp.id as granular_permission_id,
        true as can_edit_folder,
        false as can_edit_apps,
        false as can_view_apps
      FROM granular_permissions gp
      JOIN permission_groups pg ON gp.group_id = pg.id
      WHERE gp.type = 'folder'
        AND pg.type = 'default'
        AND pg.name = 'admin'
        AND NOT EXISTS (
          SELECT 1 FROM folders_group_permissions fgp
          WHERE fgp.granular_permission_id = gp.id
        );
    `);

    // Custom groups: intentionally NOT seeded. No folder/App-folders permission is added to a
    // custom group on migration — Step 1 no longer creates a granular_permissions row for them,
    // so there is nothing to grant here. Admins add App-folders permission to a custom group
    // manually when they want it.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete folder granular permissions data
    await queryRunner.query(`
      DELETE FROM folders_group_permissions 
      WHERE granular_permission_id IN (
        SELECT id FROM granular_permissions WHERE type = 'folder'
      );
    `);

    await queryRunner.query(`
      DELETE FROM granular_permissions WHERE type = 'folder';
    `);
  }
}
