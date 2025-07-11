import { User } from 'src/entities/user.entity';
import { USER_TYPE, USER_STATUS, WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { Injectable } from '@nestjs/common';
import { Brackets, EntityManager, In, Not } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { UserRepository } from '@modules/users/repositories/repository';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { ILicenseCountsService } from '../interfaces/IService';
import { APP_TYPES } from '@modules/apps/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

@Injectable()
export class LicenseCountsService implements ILicenseCountsService {
  constructor(protected readonly userRepository: UserRepository) {}

  async getUserIdWithEditPermission(organizationId: string, manager: EntityManager) {
    const statusList = [WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ACTIVE];
    // edition != cloud for instance-specific logic
    if (getTooljetEdition() !== TOOLJET_EDITIONS.Cloud) {
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
    } else {
      // Logic for cloud-based organization
      const userIdsWithEditPermissions = (
        await manager
          .createQueryBuilder(User, 'users')
          .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
            statusList,
          })
          .innerJoin(
            'users.userPermissions',
            'userPermissions',
            'organization_users.organizationId = userPermissions.organizationId'
          )
          .innerJoin(
            'userPermissions.organization',
            'organization',
            'organization.status = :activeStatus AND organization.id = :organizationId',
            {
              activeStatus: WORKSPACE_STATUS.ACTIVE,
              organizationId,
            }
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

      return userIdsWithEditPermissions;
    }
  }

  async fetchTotalEditorCount(organizationId: string, manager: EntityManager): Promise<number> {
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(organizationId, manager);
    return userIdsWithEditPermissions?.length || 0;
  }

  async fetchTotalViewerEditorCount(
    organizationId: string, // Mandatory organizationId
    manager: EntityManager
  ): Promise<{ editor: number; viewer: number }> {
    const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];

    // Get the user IDs with edit permissions
    const userIdsWithEditPermissions = await this.getUserIdWithEditPermission(organizationId, manager);

    if (!userIdsWithEditPermissions?.length) {
      // No editors -> No viewers
      return { editor: 0, viewer: 0 };
    }

    //If edition is not cloud - true
    const isInstanceSpecific = getTooljetEdition() !== TOOLJET_EDITIONS.Cloud;

    let viewers;

    if (isInstanceSpecific) {
      // Instance-specific logic (no filter by organizationId)
      viewers = new Set(
        (
          await this.userRepository.getUsers(
            {
              status: Not(USER_STATUS.ARCHIVED),
              id: Not(In(userIdsWithEditPermissions)), // Exclude editors
              organizationUsers: {
                status: In(statusList),
                organization: {
                  status: WORKSPACE_STATUS.ACTIVE, // No filter for organizationId
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
    } else {
      // Cloud-specific logic (filter by organizationId)
      viewers = new Set(
        (
          await this.userRepository.getUsers(
            {
              status: Not(USER_STATUS.ARCHIVED),
              id: Not(In(userIdsWithEditPermissions)), // Exclude editors
              organizationUsers: {
                status: In(statusList),
                organization: {
                  status: WORKSPACE_STATUS.ACTIVE,
                  id: organizationId, // Filter by organizationId for cloud logic
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
    }

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

  async getUsersCount(
    organizationId: string, // Mandatory organizationId
    isOnlyActive?: boolean,
    manager?: EntityManager
  ): Promise<number> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
      const organizationStatusList = [WORKSPACE_STATUS.ACTIVE];

      if (!isOnlyActive) {
        statusList.push(USER_STATUS.ARCHIVED);
        organizationStatusList.push(WORKSPACE_STATUS.ARCHIVE);
      }

      // (EE-specific logic)
      const isInstanceSpecific = getTooljetEdition() !== TOOLJET_EDITIONS.Cloud;

      let userCount = 0;

      if (isInstanceSpecific) {
        // EE-specific (instance-based) logic: No filter by organizationId
        const userIdsWithoutNonActiveSuperadmins = (
          await this.userRepository.getUsers(
            {
              status: In(statusList), // Apply status filter directly to users
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
        userCount = ids.length;
      } else {
        // Cloud-specific (organization/workspace-based) logic: Filter by organizationId
        const userIdsWithOrganization = (
          await this.userRepository.getUsers(
            {
              status: In(statusList),
              organizationUsers: {
                status: In(statusList),
                organization: {
                  status: In(organizationStatusList),
                  id: organizationId, // Filter by organizationId for cloud logic
                },
              },
            },
            null,
            ['organizationUsers', 'organizationUsers.organization'],
            { id: true },
            manager
          )
        ).map((user) => user.id);

        userCount = userIdsWithOrganization.length;
      }

      return userCount;
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
        type: APP_TYPES.WORKFLOW,
        ...(workspaceId && { organizationId: workspaceId }),
      },
    });
  }

  async organizationsCount(manager?: EntityManager) {
    return dbTransactionWrap(
      (manager) =>
        manager.count(Organization, {
          where: {
            status: WORKSPACE_STATUS.ACTIVE,
          },
        }), //Fetch only the organizations which are active not based on Org User status
      manager
    );
  }
  async getUserIdWithEndUserRole(manager: EntityManager): Promise<string[]> {
    const statusList = [WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ACTIVE];

    const users = await manager.find(User, {
      select: ['id'],
      where: {
        status: Not(USER_STATUS.ARCHIVED),
        organizationUsers: {
          status: In(statusList),
        },
        userPermissions: {
          name: USER_ROLE.END_USER,
          organization: {
            status: WORKSPACE_STATUS.ACTIVE,
          },
        },
      },
      relations: ['organizationUsers', 'userPermissions', 'userPermissions.organization'],
    });

    // Extract unique user IDs
    return [...new Set(users.map((user) => user.id))];
  }

  async fetchTotalAppCount(organizationId: string, manager: EntityManager): Promise<number> {
    if (getTooljetEdition() !== TOOLJET_EDITIONS.Cloud) {
      // If the edition is cloud, we do not filter by organizationId
      return manager.count(App, {
        where: {
          type: APP_TYPES.FRONT_END,
          organization: {
            status: WORKSPACE_STATUS.ACTIVE, // No filter by organizationId for instance-specific logic
          },
        },
        relations: ['organization'],
      });
    } else {
      return manager.count(App, { where: { type: APP_TYPES.FRONT_END, organizationId } });
    }
  }
}
