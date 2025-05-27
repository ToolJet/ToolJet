import { DataSource, Repository, Brackets, EntityManager, DeepPartial } from 'typeorm';
import { OrganizationUser } from '@entities/organization_user.entity';
import { USER_TYPE, WORKSPACE_USER_SOURCE, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { Injectable } from '@nestjs/common';
import { UserFilterOptions } from './types';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import * as uuid from 'uuid';

@Injectable()
export class OrganizationUsersRepository extends Repository<OrganizationUser> {
  constructor(private dataSource: DataSource) {
    super(OrganizationUser, dataSource.createEntityManager());
  }

  async createOne(
    user: User,
    organization: DeepPartial<Organization>,
    isInvite?: boolean,
    manager?: EntityManager,
    source: WORKSPACE_USER_SOURCE = WORKSPACE_USER_SOURCE.INVITE,
    isDefaultOrganization: boolean = false
  ): Promise<OrganizationUser> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        manager.create(OrganizationUser, {
          userId: user.id,
          organization,
          invitationToken: isInvite ? uuid.v4() : null,
          status: isInvite ? WORKSPACE_USER_STATUS.INVITED : WORKSPACE_USER_STATUS.ACTIVE,
          source: isDefaultOrganization ? WORKSPACE_USER_SOURCE.SIGNUP : source,
          role: 'all-users',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }, manager);
  }

  async fetchUsersByValue(organizationId: string, searchInput: string): Promise<any> {
    if (!searchInput) {
      return [];
    }

    const options: UserFilterOptions = {
      searchText: searchInput,
    };

    const query = this.createOrganizationUsersQuery(organizationId, options, 'or', true);

    const rawResults = await query.orderBy('user.email', 'ASC').limit(10).getRawMany();

    const uniqueEmails = new Set();
    const organizationUsers = rawResults.filter((row) => {
      if (!uniqueEmails.has(row.user_email)) {
        uniqueEmails.add(row.user_email);
        return true;
      }
      return false;
    });

    return organizationUsers.map((row) => ({
      email: row.user_email,
      firstName: row.user_first_name,
      lastName: row.user_last_name,
      name: `${row.user_first_name || ''} ${row.user_last_name || ''}`.trim(),
      id: row.organization_user_id,
      userId: row.user_id,
    }));
  }

  private createOrganizationUsersQuery(
    organizationId: string,
    options: UserFilterOptions,
    condition: 'and' | 'or' = 'or',
    getSuperAdmin: boolean = false
  ) {
    const query = this.createQueryBuilder('organization_user')
      .innerJoinAndSelect('organization_user.user', 'user')
      .innerJoinAndSelect(
        'user.userPermissions',
        'userPermissions',
        'userPermissions.organizationId = :organizationId',
        { organizationId }
      )
      .where('organization_user.organizationId = :organizationId', { organizationId });

    if (getSuperAdmin) {
      query.orWhere('user.userType = :userType', { userType: USER_TYPE.INSTANCE });
    }

    query.andWhere(
      new Brackets((qb) => {
        if (options.searchText) {
          qb.orWhere('LOWER(user.email) LIKE :email', { email: `%${options.searchText.toLowerCase()}%` })
            .orWhere('LOWER(user.firstName) LIKE :firstName', { firstName: `%${options.searchText.toLowerCase()}%` })
            .orWhere('LOWER(user.lastName) LIKE :lastName', { lastName: `%${options.searchText.toLowerCase()}%` });
        }
      })
    );

    if (options.status) {
      const statusCondition = condition === 'and' ? 'andWhere' : 'orWhere';
      query[statusCondition]('organization_user.status = :status', { status: options.status });
    }

    return query;
  }

  findByInvitationToken(invitationToken: string): Promise<OrganizationUser | null> {
    return this.findOne({
      where: {
        invitationToken,
      },
      relations: ['organization', 'user'],
    });
  }

  async fetchOrganizationUsersCount(organizationId: string, options: UserFilterOptions, manager?: EntityManager) {
    const condition = options?.searchText ? 'and' : 'or';
    const query = this.createOrganizationUsersQuery(organizationId, options, condition);
    return await query.getCount();
  }

  async fetchUsersWithDetails(
    organizationId: string,
    options: UserFilterOptions,
    page: number,
    pageSize: number
  ): Promise<[OrganizationUser[], number]> {
    const condition = options?.searchText || options?.status ? 'and' : 'or';
    return this.createOrganizationUsersQuery(organizationId, options, condition)
      .leftJoinAndSelect('user.userDetails', 'userDetails')
      .orderBy('user.firstName', 'ASC')
      .take(pageSize)
      .skip(pageSize * (page - 1))
      .getManyAndCount();
  }

  async getActiveWorkspacesCount(userId: string): Promise<number> {
    return await this.count({
      where: {
        userId,
        status: WORKSPACE_USER_STATUS.ACTIVE,
      },
    });
  }

  async getOrganizationUser(organizationId: string, manager?: EntityManager) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(OrganizationUser, { where: { organizationId } });
    }, manager || this.manager);
  }
}
