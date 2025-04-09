import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  FindOptionsOrder,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  In,
  Repository,
} from 'typeorm';
import { User } from '@entities/user.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { UserDetails } from '@entities/user_details.entity';
import * as bcrypt from 'bcrypt';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { isSuperAdmin } from '@helpers/utils.helper';
import * as uuid from 'uuid';

type UserFilterOptions = { searchText?: string; status?: string; page?: number };

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async getPaginatedData(options: UserFilterOptions): Promise<{ items: Array<User>; total: number }> {
    const findOptions: FindOptionsWhere<User> = {
      organizationUsers: {
        organization: {
          status: WORKSPACE_STATUS.ACTIVE,
        },
      },
    };

    if (options?.status) {
      findOptions.status = options?.status;
    }

    // For the search query, create an array of conditions
    let whereOptions: FindOptionsWhere<User> | FindOptionsWhere<User>[] = findOptions;

    if (options?.searchText) {
      const searchLower = options.searchText.toLowerCase();

      // Create an array of OR conditions
      whereOptions = [
        { ...findOptions, email: ILike(`%${searchLower}%`) },
        { ...findOptions, firstName: ILike(`%${searchLower}%`) },
        { ...findOptions, lastName: ILike(`%${searchLower}%`) },
      ];
    }

    const [items, total] = await this.manager.findAndCount(User, {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarId: true,
        status: true,
        userType: true,
        createdAt: true,
        organizationUsers: {
          id: true,
          status: true,
          organizationId: true,
          organization: {
            name: true,
            status: true,
          },
        },
      },
      relations: {
        organizationUsers: {
          organization: true,
        },
      },
      where: whereOptions,
      order: { createdAt: 'ASC' },
      take: 10,
      skip: 10 * (options?.page ? options?.page - 1 : 0),
    });

    return {
      items,
      total,
    };
  }

  async createOrUpdate(user: Partial<User>, manager?: EntityManager): Promise<User> {
    //not using upsert because hook is not supported for password digest
    return dbTransactionWrap(async (manager: EntityManager) => {
      const existingUser = await manager.findOne(User, { where: { email: user.email } });

      if (existingUser) {
        Object.assign(existingUser, user);
        return manager.save(User, existingUser);
      } else {
        const newUser = manager.create(User, user);
        return manager.save(User, newUser);
      }
    }, manager || this.manager);
  }

  getUserDetails(userId: string, organizationId: string, manager?: EntityManager): Promise<UserDetails> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(UserDetails, {
        where: {
          userId: userId,
          organizationId: organizationId,
        },
      });
    }, manager || this.manager);
  }

  getUser(
    options: FindOptionsWhere<User>,
    order?: FindOptionsOrder<User>,
    relations?: string[],
    select?: FindOptionsSelect<User>,
    manager?: EntityManager
  ): Promise<User> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(User, {
        where: { ...options },
        order: order ? order : undefined,
        select: select ? select : undefined,
        relations: relations ? relations : undefined,
      });
    }, manager || this.manager);
  }

  getUsers(
    options: FindOptionsWhere<User>,
    order?: FindOptionsOrder<User>,
    relations?: string[],
    select?: FindOptionsSelect<User>,
    manager?: EntityManager
  ): Promise<User[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(User, {
        where: { ...options },
        order: order ? order : undefined,
        select: select ? select : undefined,
        relations: relations ? relations : undefined,
      });
    }, manager || this.manager);
  }

  async updateOne(userId: string, updatableParams: Partial<User>, manager?: EntityManager): Promise<void> {
    if (updatableParams.password) {
      updatableParams.password = bcrypt.hashSync(updatableParams.password, 10);
    }
    await dbTransactionWrap((manager: EntityManager) => {
      return manager.update(User, userId, updatableParams);
    }, manager || this.manager);
  }

  async upsertUserDetails(
    updatableParams: Partial<UserDetails>,
    conflictsPaths: string[],
    manager?: EntityManager
  ): Promise<void> {
    await manager.upsert(UserDetails, updatableParams, conflictsPaths);
  }

  async findByEmail(
    email: string,
    organizationId?: string,
    status?: string | Array<string>,
    manager?: EntityManager
  ): Promise<User> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let user: User;

      if (!organizationId) {
        user = await manager.findOne(User, {
          where: { email },
        });
      } else {
        const statusList = status
          ? typeof status === 'object'
            ? status
            : [status]
          : [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ARCHIVED];

        user = await manager.findOne(User, {
          where: {
            email: email,
            organizationUsers: {
              organizationId: organizationId,
              status: In(statusList),
              organization: { status: WORKSPACE_STATUS.ACTIVE },
            },
          },
          relations: ['organizationUsers', 'organizationUsers.organization'],
        });

        if (!user) {
          user = await manager.findOne(User, {
            where: { email },
          });

          if (isSuperAdmin(user)) {
            await this.setupSuperAdmin(user, organizationId);
          } else {
            return;
          }
        }
      }
      return user;
    }, manager);
  }

  async setupSuperAdmin(user: User, organizationId?: string): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Use Organization repository
      const organizations: Organization[] = await manager.find(
        Organization,
        organizationId ? { where: { id: organizationId } } : {}
      );
      user.organizationUsers = organizations?.map((organization): OrganizationUser => {
        return {
          id: uuid.v4(),
          userId: user.id,
          organizationId: organization.id,
          organization: organization,
          status: 'active',
          source: 'invite',
          role: null,
          invitationToken: null,
          createdAt: null,
          updatedAt: null,
          user,
          hasId: null,
          save: null,
          remove: null,
          softRemove: null,
          recover: null,
          reload: null,
        };
      });
    });
  }
}
