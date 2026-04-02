import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedFolderPermissions1766500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create granular_permissions entries for folders for each existing permission_group
    // This ensures existing organizations get folder permissions based on their role
    await queryRunner.query(`
      INSERT INTO granular_permissions (group_id, name, type, is_all)
      SELECT 
        pg.id as group_id,
        'Folders' as name,
        'folder'::resource_type as type,
        true as is_all
      FROM permission_groups pg
      WHERE NOT EXISTS (
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

    // Custom groups: default to view only (conservative approach)
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
        AND pg.type = 'custom'
        AND NOT EXISTS (
          SELECT 1 FROM folders_group_permissions fgp 
          WHERE fgp.granular_permission_id = gp.id
        );
    `);
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
