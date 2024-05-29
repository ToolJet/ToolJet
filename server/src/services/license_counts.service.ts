import { User } from 'src/entities/user.entity';
import { USER_TYPE, USER_STATUS, WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { Injectable } from '@nestjs/common';
import { Brackets, EntityManager } from 'typeorm';
import { OrganizationLicenseService } from './organization_license.service';

@Injectable()
export class LicenseCountsService {
  constructor(private readonly organizationLicenseService: OrganizationLicenseService) {}
  async getUserIdWithEditPermission(manager: EntityManager) {
    const statusList = [WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ACTIVE];
    const userIdsWithEditPermissions = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
          statusList,
        })
        .innerJoin(
          'users.groupPermissions',
          'group_permissions',
          'organization_users.organizationId = group_permissions.organizationId'
        )
        .innerJoin('group_permissions.organization', 'organization', 'organization.status = :activeStatus', {
          activeStatus: WORKSPACE_STATUS.ACTIVE,
        })
        .leftJoin('group_permissions.appGroupPermission', 'app_group_permissions')
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .andWhere(
          new Brackets((qb) => {
            qb.where('app_group_permissions.read = true AND app_group_permissions.update = true').orWhere(
              'group_permissions.appCreate = true'
            );
          })
        )
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfAppOwners = (
      await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.apps', 'apps')
        .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
          statusList,
        })
        .innerJoin('organization_users.organization', 'organization', 'organization.status = :activeStatus', {
          activeStatus: WORKSPACE_STATUS.ACTIVE,
        })
        .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
        .select('users.id')
        .distinct()
        .getMany()
    ).map((record) => record.id);

    const userIdsOfSuperAdmins = (
      await manager
        .createQueryBuilder(User, 'users')
        .select('users.id')
        .where('users.userType = :userType', { userType: USER_TYPE.INSTANCE })
        .andWhere('users.status = :status', { status: USER_STATUS.ACTIVE })
        .getMany()
    ).map((record) => record.id);

    return [...new Set([...userIdsWithEditPermissions, ...userIdsOfAppOwners, ...userIdsOfSuperAdmins])];
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
    const viewer = await manager
      .createQueryBuilder(User, 'users')
      .innerJoin('users.organizationUsers', 'organization_users', 'organization_users.status IN (:...statusList)', {
        statusList,
      })
      .innerJoin('organization_users.organization', 'organization', 'organization.status = :activeStatus', {
        activeStatus: WORKSPACE_STATUS.ACTIVE,
      })
      .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .andWhere('users.id NOT IN(:...userIdsWithEditPermissions)', { userIdsWithEditPermissions })
      .select('users.id')
      .distinct()
      .getCount();

    return { editor: userIdsWithEditPermissions?.length || 0, viewer };
  }

  async fetchTotalSuperadminCount(manager: EntityManager): Promise<number> {
    return await manager
      .createQueryBuilder(User, 'users')
      .where('users.userType = :userType', { userType: USER_TYPE.INSTANCE })
      .andWhere('users.status != :archived', { archived: USER_STATUS.ARCHIVED })
      .getCount();
  }

  async getUsersCount(isOnlyActive?: boolean, manager?: EntityManager, organizationId?: string): Promise<number> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const statusList = [USER_STATUS.INVITED, USER_STATUS.ACTIVE];
      const organizationUsersCondition =
        this.organizationLicenseService.createOrganizationUsersJoinCondition(organizationId);
      const organizationStatusList = [WORKSPACE_STATUS.ACTIVE];
      !isOnlyActive && statusList.push(USER_STATUS.ARCHIVED);
      !isOnlyActive && organizationStatusList.push(WORKSPACE_STATUS.ARCHIVE);
      return await manager
        .createQueryBuilder(User, 'users')
        .innerJoin('users.organizationUsers', 'organization_users', organizationUsersCondition, {
          statusList,
          organizationId,
        })
        .innerJoin(
          'organization_users.organization',
          'organization',
          'organization.status IN (:...organizationStatusList)',
          {
            organizationStatusList,
          }
        )
        .select('users.id')
        .distinct()
        .getCount();
    }, manager);
  }
}
