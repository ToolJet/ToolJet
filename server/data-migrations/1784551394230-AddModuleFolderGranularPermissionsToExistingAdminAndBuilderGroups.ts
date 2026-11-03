import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

/**
 * Backward-compatibility rule for existing orgs:
 * - Free plan (basic/starter, incl. CE which always resolves to 'basic'): admin AND builder
 *   default groups get moduleFolderCreate/Delete + a real MODULE_FOLDER granular permission,
 *   matching DEFAULT_RESOURCE_PERMISSIONS' admin+builder-only spec for this resource.
 * - Paid plan: admin only — builder/end_user default groups are left untouched.
 * - Custom groups: never touched, on either plan (queries are scoped to type = 'default').
 * - end_user is never touched either way — there's no default-permission spec for it at all
 *   (modules, and by extension module folders, are never end-user-assignable).
 *
 * Writes are raw SQL with literals: entities and constants can change after this migration ships.
 *
 * Plan resolution: data migrations run under migrationsTransactionMode: 'all', so DB work goes
 * through `queryRunner.manager` (the shared batch transaction) to stay on the right side of the
 * DDL locks earlier migrations hold. The plan is read via the license init service:
 * - self-hosted (CE/EE): instance-level, resolved once (getPlanForMigration, reuses initForMigration);
 * - cloud: per-organization, from the organization_license table (getPlanForMigrationCloud).
 * Both read through the same shared manager.
 */
export class AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups1784551394230 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    try {
      const licenseInitService = nestApp.get(LicenseInitService);
      const manager = queryRunner.manager;
      const isCloud = getTooljetEdition() === TOOLJET_EDITIONS.Cloud;

      const [{ count: organizationsCount }] = await manager.query('SELECT count(*)::int AS count FROM organizations');
      if (organizationsCount === 0) {
        console.log('No organizations found, skipping migration.');
        return;
      }

      // Self-hosted plan is instance-level — resolve it once. Cloud is per-org (resolved in the loop).
      let isSelfHostedFreePlan = false;
      if (!isCloud) {
        const { isValid } = await licenseInitService.initForMigration(manager);
        isSelfHostedFreePlan = !isValid;
      }

      const organizations = await manager.query(`SELECT id FROM organizations`);

      for (const { id: organizationId } of organizations) {
        let isFreePlan = isSelfHostedFreePlan;
        if (isCloud) {
          const plan = await licenseInitService.getPlanForMigrationCloud(manager, organizationId);
          isFreePlan = plan === 'basic' || plan === 'starter';
        }
        const roleNamesToUpdate = isFreePlan ? ['admin', 'builder'] : ['admin'];

        const [, updatedGroups] = await manager.query(
          `
            UPDATE permission_groups
            SET module_folder_create = true, module_folder_delete = true
            WHERE organization_id = $1 AND name = ANY($2) AND type = 'default'
          `,
          [organizationId, roleNamesToUpdate]
        );

        const createdPermissions = await manager.query(
          `
            WITH new_granular AS (
              INSERT INTO granular_permissions (name, type, group_id, is_all)
              SELECT 'Module folders', 'module_folder', pg.id, true
              FROM permission_groups pg
              WHERE pg.organization_id = $1 AND pg.name = ANY($2) AND pg.type = 'default'
                AND NOT EXISTS (
                  SELECT 1 FROM granular_permissions gp
                  WHERE gp.group_id = pg.id AND gp.type = 'module_folder'
                )
              RETURNING id
            )
            INSERT INTO folders_group_permissions (granular_permission_id, can_edit_folder, can_edit_apps, can_view_apps)
            SELECT id, true, false, false FROM new_granular
            RETURNING id
          `,
          [organizationId, roleNamesToUpdate]
        );

        console.log(
          `AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups: [PROGRESS] org ${organizationId} (isFreePlan ${isFreePlan}): updated ${updatedGroups} groups, created ${createdPermissions.length} granular permissions.`
        );
      }

      console.log(
        'Successfully added module folder granular permissions to admin (and builder, on free-plan orgs) default groups.'
      );
    } finally {
      await nestApp.close();
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
