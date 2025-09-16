import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core/nest-factory';
import { AppModule } from '@modules/app/module';
import { DEFAULT_RESOURCE_PERMISSIONS, ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { DEFAULT_GRANULAR_PERMISSIONS_NAME } from '@modules/group-permissions/constants/granular_permissions';
import { getTooljetEdition } from '@helpers/utils.helper';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';

export class AddWorkflowGranularPermissionsToExistingAdminGroups1758009004418 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    // Check if this is Enterprise Edition - skip for Community Edition
    if (getTooljetEdition() === TOOLJET_EDITIONS.CE) {
      console.log('Community Edition detected, skipping workflow granular permissions migration.');
      return;
    }

    const organizationsCount = await manager.count('organizations');
    if (organizationsCount === 0) {
      console.log('No organizations found, skipping migration.');
      return;
    }

    // Create NestJS application context to access services
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const appCtx = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const { GranularPermissionsUtilService } = await import(
      `${await getImportPath(true, edition)}/group-permissions/util-services/granular-permissions.util.service`
    );

    const granularPermissionsUtilService = appCtx.get(GranularPermissionsUtilService, { strict: false });

    try {
      // Get all existing admin groups across all organizations
      const adminGroups = await manager.query(`
            SELECT id, organization_id
            FROM permission_groups
            WHERE name = 'admin' AND type = 'default'
          `);

      console.log(`Found ${adminGroups.length} admin groups to update with workflow granular permissions.`);

      // For each admin group, create workflow granular permissions
      for (const group of adminGroups) {
        const { id: groupId, organization_id: organizationId } = group;

        // Check if workflow granular permission already exists for this group
        const existingPermission = await manager.query(
          `
              SELECT id FROM granular_permissions
              WHERE group_id = $1 AND type = 'workflow'
            `,
          [groupId]
        );

        if (existingPermission.length > 0) {
          console.log(`Workflow granular permission already exists for group ${groupId}, skipping.`);
          continue;
        }

        // Use the same pattern as createDefaultGroups function
        const createResourcePermissionObj = DEFAULT_RESOURCE_PERMISSIONS[USER_ROLE.ADMIN][ResourceType.WORKFLOWS];

        const dtoObject = {
          name: DEFAULT_GRANULAR_PERMISSIONS_NAME[ResourceType.WORKFLOWS], // 'Workflows'
          groupId: groupId,
          type: ResourceType.WORKFLOWS, // 'workflow'
          isAll: true,
          createResourcePermissionObject: {},
        };

        console.log(
          `Creating workflow granular permission for admin group ${groupId} in organization ${organizationId}`
        );

        await granularPermissionsUtilService.create(
          {
            createGranularPermissionDto: dtoObject,
            organizationId,
          },
          createResourcePermissionObj, // { canEdit: true, canView: false }
          manager
        );
      }

      console.log('Successfully added workflow granular permissions to all existing admin groups.');
    } catch (error) {
      console.error('Error adding workflow granular permissions:', error);
      throw error;
    } finally {
      await appCtx.close();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
