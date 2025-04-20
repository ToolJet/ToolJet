import { Brackets, EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppModule } from '@modules/app/module';
import { NestFactory } from '@nestjs/core';
import { LicenseCountsService } from '@ee/licensing/services/count.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { OrganizationUser } from '@entities/organization_user.entity';
import { USER_STATUS, USER_TYPE, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { User } from '@entities/user.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';
export class EnforceNewBasicPlanLimits1742369617678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const licenseInitService = nestApp.get(LicenseInitService);

    try {
      const { isValid } = await licenseInitService.initForMigration(manager);
      console.log('isValid', isValid);
      if (!isValid) {
        await dbTransactionWrap(async (manager: EntityManager) => {
          const licenseCountsService = nestApp.get(LicenseCountsService);

          const statusList = [WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ACTIVE];

          const usersWithEditPermission = (
            await manager
              .createQueryBuilder(User, 'users')
              .innerJoin(
                'users.organizationUsers',
                'organization_users',
                'organization_users.status IN (:...statusList)',
                {
                  statusList,
                }
              )
              .innerJoin(
                'users.userPermissions',
                'userPermissions',
                'organization_users.organizationId = userPermissions.organizationId'
              )
              .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
              .andWhere(
                new Brackets((qb) => {
                  qb.where('userPermissions.name = :admin OR userPermissions.name = :builder', {
                    admin: USER_ROLE.ADMIN,
                    builder: USER_ROLE.BUILDER,
                  });
                })
              )
              .select('users.id')
              .distinct()
              .getMany()
          ).map((record) => record.id);

          console.log('usersWithEditPermission', usersWithEditPermission);

          //More than 2 Editors

          if (usersWithEditPermission?.length > 2) {
            const users = await manager
              .createQueryBuilder(User, 'users')
              .where('users.id IN (:...userIds)', { userIds: usersWithEditPermission })
              .select(['users.id', 'users.userType', 'userPermissions.name'])
              .innerJoin('users.userPermissions', 'userPermissions')
              .getMany();

            // Exclude users who are super admins (user_type = 'instance')
            const filteredUsers = users.filter((user) => user.userType !== USER_TYPE.INSTANCE);

            const admins = filteredUsers
              .filter((user) => user.userPermissions.some((permission) => permission.name === USER_ROLE.ADMIN))
              .map((user) => user.id);
            const builders = filteredUsers
              .filter((user) => user.userPermissions.some((permission) => permission.name === USER_ROLE.BUILDER))
              .map((user) => user.id);

            //If more than 2 admins, archive rest of the admins and all other builders
            if (admins?.length > 1) {
              const adminIdsToArchive = admins.slice(1);
              await manager
                .createQueryBuilder()
                .update(OrganizationUser)
                .set({ status: WORKSPACE_USER_STATUS.ARCHIVED, invitationToken: null }) //Workspace level archive
                .where('userId IN (:...ids)', { ids: adminIdsToArchive })
                .execute();

              await manager
                .createQueryBuilder()
                .update(User)
                .set({ status: USER_STATUS.ARCHIVED })
                .where('id IN (:...ids)', { ids: adminIdsToArchive }) //Instance level archive
                .execute();

              if (builders?.length) {
                await manager
                  .createQueryBuilder()
                  .update(OrganizationUser)
                  .set({ status: WORKSPACE_USER_STATUS.ARCHIVED, invitationToken: null })
                  .where('userId IN (:...ids)', { ids: builders })
                  .execute();
                await manager
                  .createQueryBuilder()
                  .update(User)
                  .set({ status: USER_STATUS.ARCHIVED })
                  .where('id IN (:...ids)', { ids: builders })
                  .execute();
              }
              //If 1 admin and more than 1 builder, archive all builders except the first one
            } else if (admins?.length === 0 && builders?.length > 1) {
              const buildersToArchive = builders.slice(1);
              await manager
                .createQueryBuilder()
                .update(OrganizationUser)
                .set({ status: WORKSPACE_USER_STATUS.ARCHIVED, invitationToken: null })
                .where('userId IN (:...ids)', { ids: buildersToArchive })
                .execute();

              await manager
                .createQueryBuilder()
                .update(User)
                .set({ status: USER_STATUS.ARCHIVED })
                .where('id IN (:...ids)', { ids: buildersToArchive })
                .execute();
            } else {
              //Only 1 admin and 1 super admin archive all builders
              if (builders?.length) {
                await manager
                  .createQueryBuilder()
                  .update(OrganizationUser)
                  .set({ status: WORKSPACE_USER_STATUS.ARCHIVED, invitationToken: null })
                  .where('userId IN (:...ids)', { ids: builders })
                  .execute();
                await manager
                  .createQueryBuilder()
                  .update(User)
                  .set({ status: USER_STATUS.ARCHIVED })
                  .where('id IN (:...ids)', { ids: builders })
                  .execute();
              }
            }
          }

          const viewerIds = await licenseCountsService.getUserIdWithEndUserRole(manager);
          console.log('viewerIds', viewerIds);
          //If more than 50 end users, achive the rest after the first 50
          if (viewerIds?.length > 50) {
            const viewersToArchive = viewerIds.slice(50);
            await manager
              .createQueryBuilder()
              .update(OrganizationUser)
              .set({ status: WORKSPACE_USER_STATUS.ARCHIVED, invitationToken: null })
              .where('userId IN (:...ids)', { ids: viewersToArchive })
              .execute();

            await manager
              .createQueryBuilder()
              .update(User)
              .set({ status: USER_STATUS.ARCHIVED })
              .where('id IN (:...ids)', { ids: viewersToArchive })
              .execute();
          }
        }, manager);
      }
    } catch (error) {
      console.error('Error occurred during migration:', error);
      throw error;
    } finally {
      await nestApp.close();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
