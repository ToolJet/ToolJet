import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

/**
 * Backward-compatibility rule for existing orgs:
 * - Free plan (basic/starter, incl. CE which always resolves to 'basic'): admin AND builder
 *   default groups get moduleFolderCreate/Delete + a real MODULE_FOLDER granular permission,
 *   matching DEFAULT_RESOURCE_PERMISSIONS' admin+builder-only spec for this resource.
 * - Paid plan: admin only — builder/end_user default groups are left untouched.
 * - Custom groups: never touched, on either plan (queries are scoped to type = 'default').
 * - end_user is never touched either way — there's no default-permission spec for it at all
 *   (modules, and by extension module folders, are never end-user-assignable).
 */
export class AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups1784551394230
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    try {
      const licenseTermsService = nestApp.get(LicenseTermsService);

      return await dbTransactionWrap(async (manager: EntityManager) => {
        const organizationsCount = await manager.count('organizations');
        if (organizationsCount === 0) {
          console.log('No organizations found, skipping migration.');
          return;
        }

        const organizations = await manager.query(`SELECT id FROM organizations`);

        for (const { id: organizationId } of organizations) {
          const plan = await licenseTermsService.getLicenseTerms(LICENSE_FIELD.PLAN, organizationId);
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
      }, manager);
    } finally {
      await nestApp.close();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
