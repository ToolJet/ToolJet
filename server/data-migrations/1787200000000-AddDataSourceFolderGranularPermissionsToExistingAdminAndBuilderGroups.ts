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

const MIGRATION_NAME = 'AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1787200000000';

/**
 * Backward-compatibility rule for existing orgs (identical policy to the module-folder migration
 * 1784551394230, since data-source folders are builder/admin-facing like modules):
 * - Free plan (basic/starter, incl. CE which always resolves to 'basic'): admin AND builder
 *   default groups get dataSourceFolderCreate/Delete + a real DATA_SOURCE_FOLDER granular permission.
 * - Paid plan: admin only — builder/end_user default groups are left untouched.
 * - Custom groups: never touched (queries scoped to type = 'default').
 * - end_user is never touched either way — data sources (and their folders) are not end-user-assignable.
 *
 * Plan resolution mirrors the module-folder migration: data migrations run under
 * migrationsTransactionMode: 'all', so DB work goes through queryRunner.manager (the shared batch
 * transaction). Self-hosted (CE/EE) plan is instance-level; cloud is per-organization.
 */
export class AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1787200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    try {
      const licenseInitService = nestApp.get(LicenseInitService);
      const manager = queryRunner.manager;
      const isCloud = getTooljetEdition() === TOOLJET_EDITIONS.Cloud;

      const organizationsCount = await manager.count('organizations');
      if (organizationsCount === 0) {
        console.log(`${MIGRATION_NAME}: No organizations found, skipping migration.`);
        return;
      }

      // Self-hosted plan is instance-level — resolve it once. Cloud is per-org (resolved in the loop).
      const instancePlan = isCloud ? null : await licenseInitService.getPlanForMigration(manager);

      const organizations = await manager.query(`SELECT id FROM organizations`);
      console.log(`${MIGRATION_NAME}: [START] Seeding data-source-folder permissions: ${organizations.length}`);

      let processed = 0;
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
              SET data_source_folder_create = true, data_source_folder_delete = true
              WHERE id = $1
            `,
            [groupId]
          );

          const existingPermission = await manager.find(GranularPermissions, {
            where: { groupId, type: ResourceType.DATA_SOURCE_FOLDER },
          });

          if (existingPermission.length > 0) {
            console.log(
              `${MIGRATION_NAME}: Data-source-folder permission already exists for group ${groupId}, skipping.`
            );
            continue;
          }

          const granularPermissions = manager.create(GranularPermissions, {
            name: DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.DATA_SOURCE_FOLDER],
            type: ResourceType.DATA_SOURCE_FOLDER,
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
        }

        processed++;
        console.log(`${MIGRATION_NAME}: [PROGRESS] ${processed}/${organizations.length}`);
      }

      console.log(`${MIGRATION_NAME}: [SUCCESS] Seeding data-source-folder permissions finished.`);
    } finally {
      await nestApp.close();
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
