import { User } from 'src/entities/user.entity';
import { USER_TYPE, USER_STATUS, WORKSPACE_STATUS } from 'src/helpers/user_lifecycle';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrganizationLicenseService } from './organization_license.service';

@Injectable()
export class LicenseCountsService {
  constructor(private readonly organizationLicenseService: OrganizationLicenseService) {}

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
