import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillEnvironmentPermissionsForBuilders1733275000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Starting data migration: Backfill environment permissions for front-end apps only');

    // Debug: Check what we're about to update
    const builderCheck = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM apps_group_permissions agp
      JOIN granular_permissions gp ON agp.granular_permission_id = gp.id
      JOIN permission_groups g ON gp.group_id = g.id
      WHERE g.name = 'builder'
        AND g.type = 'default'
        AND agp.app_type = 'front-end'
    `);
    console.log(`Found ${builderCheck[0].count} builder front-end app permissions to update`);

    // 1. Admin groups: Enable all environments for front-end apps (backfill)
    const adminResult = await queryRunner.query(`
      UPDATE apps_group_permissions agp
      SET 
        can_access_development = true,
        can_access_staging = true,
        can_access_production = true,
        can_access_released = true
      FROM granular_permissions gp
      JOIN permission_groups g ON gp.group_id = g.id
      WHERE agp.granular_permission_id = gp.id
        AND g.name = 'admin'
        AND g.type = 'default'
        AND agp.app_type = 'front-end'
    `);
    console.log(`Admin groups: All environments enabled for front-end apps (${adminResult[1]} rows updated)`);

    // 2. Builder groups: Enable dev, staging, and released environments for front-end apps (backfill)
    // Builders should have access to Development, Staging, and Released (but NOT Production)
    const builderResult = await queryRunner.query(`
      UPDATE apps_group_permissions agp
      SET 
        can_access_development = true,
        can_access_staging = true,
        can_access_production = true,
        can_access_released = true
      FROM granular_permissions gp
      JOIN permission_groups g ON gp.group_id = g.id
      WHERE agp.granular_permission_id = gp.id
        AND g.name = 'builder'
        AND g.type = 'default'
        AND agp.app_type = 'front-end'
    `);
    console.log(
      `Builder groups: Dev, staging, and released environments enabled for front-end apps (${builderResult[1]} rows updated)`
    );

    // 3. End-user groups: Only Released environment for front-end apps (backfill)
    // End-users can only access Released apps, not Development, Staging, or Production
    const endUserResult = await queryRunner.query(`
      UPDATE apps_group_permissions agp
      SET 
        can_access_development = false,
        can_access_staging = false,
        can_access_production = false,
        can_access_released = true
      FROM granular_permissions gp
      JOIN permission_groups g ON gp.group_id = g.id
      WHERE agp.granular_permission_id = gp.id
        AND g.name = 'end-user'
        AND g.type = 'default'
        AND agp.app_type = 'front-end'
    `);
    console.log(
      `End-user groups: Only Released environment enabled for front-end apps (${endUserResult[1]} rows updated)`
    );

    // 4. Custom groups: Check first user's role to determine group type
    // Get all custom groups with their first user's role
    const customGroups = await queryRunner.query(`
      SELECT DISTINCT
        g.id as group_id,
        g.name as group_name,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM group_users gu
            JOIN organization_users ou ON gu.user_id = ou.user_id
            JOIN users u ON ou.user_id = u.id
            WHERE gu.group_id = g.id 
              AND u.status != 'archived'
              AND ou.status != 'archived'
            LIMIT 1
          ) THEN (
            SELECT pg_check.name
            FROM group_users gu_check
            JOIN organization_users ou_check ON gu_check.user_id = ou_check.user_id
            JOIN users u_check ON ou_check.user_id = u_check.id
            JOIN group_users gu_role ON u_check.id = gu_role.user_id
            JOIN permission_groups pg_check ON gu_role.group_id = pg_check.id
            WHERE gu_check.group_id = g.id
              AND u_check.status != 'archived'
              AND ou_check.status != 'archived'
              AND pg_check.type = 'default'
              AND pg_check.name IN ('builder', 'end-user')
            ORDER BY gu_check.created_at ASC
            LIMIT 1
          )
          ELSE NULL
        END as user_role
      FROM permission_groups g
      WHERE g.type = 'custom'
    `);

    console.log(`Found ${customGroups.length} custom groups to process`);

    // Process custom groups based on their user type
    for (const group of customGroups) {
      if (!group.user_role) {
        console.log(`Custom group "${group.group_name}" (${group.group_id}): No users found, skipping`);
        continue;
      }

      if (group.user_role === 'end-user') {
        // Custom group with end-users: Only Released environment
        const customEndUserResult = await queryRunner.query(
          `
          UPDATE apps_group_permissions agp
          SET 
            can_access_development = false,
            can_access_staging = false,
            can_access_production = false,
            can_access_released = true
          FROM granular_permissions gp
          WHERE agp.granular_permission_id = gp.id
            AND gp.group_id = $1
            AND agp.app_type = 'front-end'
        `,
          [group.group_id]
        );
        console.log(
          `Custom group "${group.group_name}" (${group.group_id}): End-user group, only Released enabled (${customEndUserResult[1]} rows)`
        );
      } else if (group.user_role === 'builder') {
        // Custom group with builders: Enable dev, staging, and released
        // Production access based on edit permission (true if can_edit, false otherwise)
        const customBuilderResult = await queryRunner.query(
          `
          UPDATE apps_group_permissions agp
          SET 
            can_access_development = true,
            can_access_staging = true,
            can_access_production = agp.can_edit,
            can_access_released = true
          FROM granular_permissions gp
          WHERE agp.granular_permission_id = gp.id
            AND gp.group_id = $1
            AND agp.app_type = 'front-end'
        `,
          [group.group_id]
        );
        console.log(
          `Custom group "${group.group_name}" (${group.group_id}): Builder group, dev/staging/released enabled, production based on edit permission (${customBuilderResult[1]} rows)`
        );
      }
    }

    console.log('Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Rolling back data migration: Restore previous state for front-end apps');

    // Restore all front-end app groups to have production access
    await queryRunner.query(`
      UPDATE apps_group_permissions agp
      SET can_access_production = true
      FROM granular_permissions gp
      JOIN permission_groups g ON gp.group_id = g.id
      WHERE agp.granular_permission_id = gp.id
        AND g.type = 'default'
        AND agp.app_type = 'front-end'
    `);

    console.log('All front-end app groups restored: Production access enabled');
  }
}
