import { User } from 'src/entities/user.entity';
import { USER_TYPE, USER_STATUS, WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { EntityManager, In, Not } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { UserRepository } from '@modules/users/repository';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { ILicenseCountsService } from '../interfaces/IService';

@Injectable()
export class LicenseCountsService implements ILicenseCountsService {
  constructor(protected readonly userRepository: UserRepository) {}
  async getUserIdWithEditPermission(manager: EntityManager) {
    const statusList = [WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ACTIVE];
    const userIdsWithEditPermissions = new Set(
      (
        await this.userRepository.getUsers(
          {
            status: Not(USER_STATUS.ARCHIVED),
            organizationUsers: {
              status: In(statusList),
              organization: {
                status: WORKSPACE_STATUS.ACTIVE,
              },
            },
            userPermissions: {
              name: In([USER_ROLE.ADMIN, USER_ROLE.BUILDER]),
            },
          },
          null,
          ['organizationUsers', 'organizationUsers.organization', 'userPermissions'],
          { id: true },
          manager
        )
      ).map((record) => record.id)
    );

    return userIdsWithEditPermissions?.size ? Array.from(userIdsWithEditPermissions) : [];
  }

  async fetchTotalEditorCount(manager: EntityManager): Promise<number> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager);
    return userIdsWithEditPermissions?.length || 0;
  }

  async fetchTotalViewerEditorCount(manager: EntityManager): Promise<{ editor: number; viewer: number }> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(manager);

    if (!userIdsWithEditPermissions?.length) {
      // No editors -> No viewers
      return { editor: 0, viewer: 0 };
    }

    const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];

    const viewers = new Set(
      (
        await this.userRepository.getUsers(
          {
            status: Not(USER_STATUS.ARCHIVED),
            id: Not(In(userIdsWithEditPermissions)),
            organizationUsers: {
              status: In(statusList),
              organization: {
                status: WORKSPACE_STATUS.ACTIVE,
              },
            },
          },
          null,
          ['organizationUsers', 'organizationUsers.organization'],
          { id: true },
          manager
        )
      ).map((user) => user.id)
    );

    const viewerCount: number = viewers?.size || 0;

    return { editor: userIdsWithEditPermissions?.length || 0, viewer: viewerCount };
  }

  async fetchTotalSuperadminCount(manager: EntityManager): Promise<number> {
    return await manager
      .createQueryBuilder(User, 'users')
      .where('users.userType = :userType', { userType: USER_TYPE.INSTANCE })
      .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .getCount();
  }

  async getUsersCount(isOnlyActive?: boolean, manager?: EntityManager): Promise<number> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
      const organizationStatusList = [WORKSPACE_STATUS.ACTIVE];

      if (!isOnlyActive) {
        statusList.push(USER_STATUS.ARCHIVED);
        organizationStatusList.push(WORKSPACE_STATUS.ARCHIVE);
      }
      const userIdsWithoutNonActiveSuperadmins = (
        await this.userRepository.getUsers(
          {
            organizationUsers: {
              status: In(statusList),
              organization: {
                status: In(organizationStatusList),
              },
            },
          },
          null,
          ['organizationUsers', 'organizationUsers.organization'],
          { id: true },
          manager
        )
      ).map((record) => record.id);
      const userIdsOfSuperAdmins = await this.#fetchSuperAdminIds(manager);
      const ids = [...new Set([...userIdsWithoutNonActiveSuperadmins, ...userIdsOfSuperAdmins])];

      return ids.length;
    }, manager);
  }

  async #fetchSuperAdminIds(manager: EntityManager): Promise<string[]> {
    const userIdsOfSuperAdmins = (
      await this.userRepository.getUsers(
        {
          userType: USER_TYPE.INSTANCE,
          status: Not(USER_STATUS.ARCHIVED),
        },
        null,
        null,
        { id: true },
        manager
      )
    ).map((record) => record.id);
    return userIdsOfSuperAdmins;
  }

  fetchTotalWorkflowsCount(workspaceId: string, manager: EntityManager): Promise<number> {
    return manager.count(App, {
      where: {
        type: 'workflow',
        ...(workspaceId && { organizationId: workspaceId }),
      },
    });
  }

  async organizationsCount(manager?: EntityManager) {
    return dbTransactionWrap(
      (manager) =>
        manager
          .createQueryBuilder(Organization, 'organizations')
          .where('organizations.status = :status', { status: WORKSPACE_STATUS.ACTIVE })
          .getCount(), //Fetch only the organizations which are active not based on Org User status
      manager
    );
  }

  async getUserIdWithEndUserRole(manager: EntityManager): Promise<string[]> {
    const statusList = [WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ACTIVE];

    return manager
      .createQueryBuilder(User, 'users')
      .innerJoin('users.organizationUsers', 'ou', 'ou.status IN (:...statusList)', { statusList })
      .innerJoin('users.userPermissions', 'up', 'ou.organizationId = up.organizationId')
      .innerJoin('up.organization', 'org', 'org.status = :activeStatus', {
        activeStatus: WORKSPACE_STATUS.ACTIVE,
      })
      .where('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .andWhere('up.name = :endUser', { endUser: USER_ROLE.END_USER })
      .select('users.id', 'id')
      .distinct(true)
      .getRawMany()
      .then((records) => records.map((record) => record.id));
  }

  async fetchTotalAppCount(manager: EntityManager): Promise<number> {
    const result = await manager.query(`
      SELECT COUNT(*) AS count
      FROM apps a
      INNER JOIN organizations o ON a.organization_id = o.id
      WHERE a.type = 'front-end' AND o.status = 'active'
    `);
    return Number(result[0].count);
  }

  async appsCount(manager: EntityManager): Promise<number> {
    return manager
      .createQueryBuilder('apps', 'a')
      .innerJoin('organizations', 'o', 'a.organization_id = o.id')
      .where('a.type = :type', { type: 'front-end' })
      .andWhere('o.status = :status', { status: 'active' })
      .getCount();
  }
}
