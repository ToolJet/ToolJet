import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
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

      const organizationsCount = await manager.count('organizations');
      if (organizationsCount === 0) {
        console.log('No organizations found, skipping migration.');
        return;
      }

      // Self-hosted plan is instance-level — resolve it once. Cloud is per-org (resolved in the loop).
      const instancePlan = isCloud ? null : await licenseInitService.getPlanForMigration(manager);

      const organizations = await manager.query(`SELECT id FROM organizations`);

      for (const { id: organizationId } of organizations) {
        const plan = isCloud
          ? await licenseInitService.getPlanForMigrationCloud(manager, organizationId)
          : instancePlan;
        const isFreePlan = plan === 'basic' || plan === 'starter';
        const roleNamesToUpdate = isFreePlan ? [USER_ROLE.ADMIN, USER_ROLE.BUILDER] : [USER_ROLE.ADMIN];

        const groups = await manager.query(
          `
            SELECT id
            FROM permission_groups
            WHERE organization_id = $1 AND name = ANY($2) AND type = 'default'
          `,
          [organizationId, roleNamesToUpdate]
        );

        for (const group of groups) {
          const { id: groupId } = group;

          await manager.query(
            `
              UPDATE permission_groups
              SET module_folder_create = true, module_folder_delete = true
              WHERE id = $1
            `,
            [groupId]
          );

          const existingPermission = await manager.find(GranularPermissions, {
            where: { groupId, type: ResourceType.MODULE_FOLDER },
          });

          if (existingPermission.length > 0) {
            console.log(`Module folder granular permission already exists for group ${groupId}, skipping.`);
            continue;
          }

          const granularPermissions = manager.create(GranularPermissions, {
            name: DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.MODULE_FOLDER],
            type: ResourceType.MODULE_FOLDER,
            groupId,
            isAll: true,
          });

          const savedGranularPermissions = await manager.save(granularPermissions);

          const foldersGroupPermissions = manager.create(FoldersGroupPermissions, {
            granularPermissionId: savedGranularPermissions.id,
            canEditFolder: true,
            canEditApps: false,
            canViewApps: false,
          });

          await manager.save(foldersGroupPermissions);

          console.log(
            `Created module folder granular permission and folders group permission for group ${groupId} (org ${organizationId}, plan ${plan}).`
          );
        }
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
