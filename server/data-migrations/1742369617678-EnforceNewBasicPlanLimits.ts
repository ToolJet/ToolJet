import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppModule } from '@modules/app/module';
import { NestFactory } from '@nestjs/core';
import { LicenseCountsService } from '@ee/licensing/services/count.service';
import { USER_STATUS, USER_TYPE, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';

export class EnforceNewBasicPlanLimits1742369617678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const licenseInitService = nestApp.get(LicenseInitService);

    const { isValid } = await licenseInitService.initForMigration(manager);
    if (!isValid) {
      const licenseCountsService = nestApp.get(LicenseCountsService);

      const statusList = [WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ACTIVE];
      const statusListStr = statusList.map((status) => `'${status}'`).join(',');

      // Get users with edit permission using native query - FIXED table name from group_permissions to permission_groups
      const usersWithEditPermissionQuery = `
        SELECT DISTINCT users.id 
        FROM users
        INNER JOIN organization_users ON users.id = organization_users.user_id AND organization_users.status IN (${statusListStr})
        INNER JOIN group_users ON users.id = group_users.user_id
        INNER JOIN permission_groups ON group_users.group_id = permission_groups.id AND organization_users.organization_id = permission_groups.organization_id
        WHERE users.status != '${USER_STATUS.ARCHIVED}'
        AND (permission_groups.name = '${USER_ROLE.ADMIN}' OR permission_groups.name = '${USER_ROLE.BUILDER}')
      `;

      const usersWithEditPermissionResult = await manager.query(usersWithEditPermissionQuery);
      const usersWithEditPermission = usersWithEditPermissionResult.map((record) => record.id);

      // More than 2 Editors
      if (usersWithEditPermission?.length > 2) {
        // Get admin users directly with native query (excluding instance users) - FIXED table name
        const adminsQuery = `
          SELECT DISTINCT users.id
          FROM users
          INNER JOIN group_users ON users.id = group_users.user_id
          INNER JOIN permission_groups ON group_users.group_id = permission_groups.id
          WHERE users.id IN (${usersWithEditPermission.map((id) => `'${id}'`).join(',')})
          AND users.user_type != '${USER_TYPE.INSTANCE}'
          AND permission_groups.name = '${USER_ROLE.ADMIN}'
        `;

        const adminsResult = await manager.query(adminsQuery);
        const admins = adminsResult.map((record) => record.id);

        // Get builder users directly with native query (excluding instance users) - FIXED table name
        const buildersQuery = `
          SELECT DISTINCT users.id
          FROM users
          INNER JOIN group_users ON users.id = group_users.user_id
          INNER JOIN permission_groups ON group_users.group_id = permission_groups.id
          WHERE users.id IN (${usersWithEditPermission.map((id) => `'${id}'`).join(',')})
          AND users.user_type != '${USER_TYPE.INSTANCE}'
          AND permission_groups.name = '${USER_ROLE.BUILDER}'
        `;

        const buildersResult = await manager.query(buildersQuery);
        const builders = buildersResult.map((record) => record.id);

        console.log('Admins:', admins);
        console.log('Builders:', builders);

        // If more than 2 admins, archive rest of the admins and all other builders
        if (admins?.length > 1) {
          const adminIdsToArchive = admins.slice(1);

          // Archive admins at workspace level
          if (adminIdsToArchive.length > 0) {
            const archiveAdminsWorkspaceQuery = `
              UPDATE organization_users 
              SET status = '${WORKSPACE_USER_STATUS.ARCHIVED}', invitation_token = NULL
              WHERE user_id IN (${adminIdsToArchive.map((id) => `'${id}'`).join(',')})
            `;
            await manager.query(archiveAdminsWorkspaceQuery);

            // Archive admins at instance level
            const archiveAdminsInstanceQuery = `
              UPDATE users
              SET status = '${USER_STATUS.ARCHIVED}'
              WHERE id IN (${adminIdsToArchive.map((id) => `'${id}'`).join(',')})
            `;
            await manager.query(archiveAdminsInstanceQuery);
          }

          // Archive all builders
          if (builders?.length > 0) {
            const archiveBuildersWorkspaceQuery = `
              UPDATE organization_users 
              SET status = '${WORKSPACE_USER_STATUS.ARCHIVED}', invitation_token = NULL
              WHERE user_id IN (${builders.map((id) => `'${id}'`).join(',')})
            `;
            await manager.query(archiveBuildersWorkspaceQuery);

            const archiveBuildersInstanceQuery = `
              UPDATE users
              SET status = '${USER_STATUS.ARCHIVED}'
              WHERE id IN (${builders.map((id) => `'${id}'`).join(',')})
            `;
            await manager.query(archiveBuildersInstanceQuery);
          }
        }
        // If 0 admin and more than 1 builder, archive all builders except the first one
        else if (admins?.length === 0 && builders?.length > 1) {
          const buildersToArchive = builders.slice(1);

          if (buildersToArchive.length > 0) {
            const archiveBuildersWorkspaceQuery = `
              UPDATE organization_users 
              SET status = '${WORKSPACE_USER_STATUS.ARCHIVED}', invitation_token = NULL
              WHERE user_id IN (${buildersToArchive.map((id) => `'${id}'`).join(',')})
            `;
            await manager.query(archiveBuildersWorkspaceQuery);

            const archiveBuildersInstanceQuery = `
              UPDATE users
              SET status = '${USER_STATUS.ARCHIVED}'
              WHERE id IN (${buildersToArchive.map((id) => `'${id}'`).join(',')})
            `;
            await manager.query(archiveBuildersInstanceQuery);
          }
        }
        // Only 1 admin and 1 super admin, archive all builders
        else if (builders?.length > 0) {
          const archiveBuildersWorkspaceQuery = `
            UPDATE organization_users 
            SET status = '${WORKSPACE_USER_STATUS.ARCHIVED}', invitation_token = NULL
            WHERE user_id IN (${builders.map((id) => `'${id}'`).join(',')})
          `;
          await manager.query(archiveBuildersWorkspaceQuery);

          const archiveBuildersInstanceQuery = `
            UPDATE users
            SET status = '${USER_STATUS.ARCHIVED}'
            WHERE id IN (${builders.map((id) => `'${id}'`).join(',')})
          `;
          await manager.query(archiveBuildersInstanceQuery);
        }
      }

      // Handle viewers/end users limit
      const viewerIds = await licenseCountsService.getUserIdWithEndUserRole(manager);
      console.log('Viewer IDs:', viewerIds);

      // If more than 50 end users, archive the rest after the first 50
      if (viewerIds?.length > 50) {
        const viewersToArchive = viewerIds.slice(50);

        if (viewersToArchive.length > 0) {
          const archiveViewersWorkspaceQuery = `
            UPDATE organization_users 
            SET status = '${WORKSPACE_USER_STATUS.ARCHIVED}', invitation_token = NULL
            WHERE user_id IN (${viewersToArchive.map((id) => `'${id}'`).join(',')})
          `;
          await manager.query(archiveViewersWorkspaceQuery);

          const archiveViewersInstanceQuery = `
            UPDATE users
            SET status = '${USER_STATUS.ARCHIVED}'
            WHERE id IN (${viewersToArchive.map((id) => `'${id}'`).join(',')})
          `;
          await manager.query(archiveViewersInstanceQuery);
        }
      }
    }
    await nestApp.close();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No down migration implementation
  }
}
