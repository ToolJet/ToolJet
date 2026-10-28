import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFolderPermissions1766500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create granular_permissions entries for folders — ONLY for DEFAULT groups
    // (admin / builder / end_user). Custom groups must NOT get any permission added
    // automatically on migration; a folder (App folders) permission is granted to a custom
    // group only when an admin explicitly configures it. Scoping to pg.type = 'default' here
    // (and dropping the custom-groups seeding below) keeps custom groups untouched.
    await queryRunner.query(`
      INSERT INTO granular_permissions (group_id, name, type, is_all)
      SELECT
        pg.id as group_id,
        'Folders' as name,
        'folder'::resource_type as type,
        true as is_all
      FROM permission_groups pg
      WHERE pg.type = 'default'
      AND NOT EXISTS (
        SELECT 1 FROM granular_permissions gp
        WHERE gp.group_id = pg.id AND gp.type = 'folder'
      );
    `);

    // Step 2: Create folders_group_permissions for each new granular permission
    // Set permissions based on group type (admin, builder, end_user)

    // Admin groups: Edit folder permission (highest level)
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

    // Builder groups: Edit folder permission (per PRD: "Edit folders - All folders")
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
        AND pg.name = 'builder'
        AND NOT EXISTS (
          SELECT 1 FROM folders_group_permissions fgp 
          WHERE fgp.granular_permission_id = gp.id
        );
    `);

    // End-user groups: view only
    await queryRunner.query(`
      INSERT INTO folders_group_permissions (granular_permission_id, can_edit_folder, can_edit_apps, can_view_apps)
      SELECT 
        gp.id as granular_permission_id,
        false as can_edit_folder,
        false as can_edit_apps,
        true as can_view_apps
      FROM granular_permissions gp
      JOIN permission_groups pg ON gp.group_id = pg.id
      WHERE gp.type = 'folder'
        AND pg.type = 'default'
        AND pg.name = 'end_user'
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
