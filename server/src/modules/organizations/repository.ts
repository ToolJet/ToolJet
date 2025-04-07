import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, FindManyOptions, FindOptionsSelect, ILike, In, Repository } from 'typeorm';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { catchDbException, isSuperAdmin } from '@helpers/utils.helper';
import { ConfigScope, SSOType } from '@entities/sso_config.entity';
import { WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { CONSTRAINTS } from './constants';
import { OrganizationInputs } from '@modules/setup-organization/types/organization-inputs';

@Injectable()
export class OrganizationRepository extends Repository<Organization> {
  constructor(private dataSource: DataSource) {
    super(Organization, dataSource.createEntityManager());
  }

  async get(id: string): Promise<Organization> {
    return await this.findOne({ where: { id }, relations: ['ssoConfigs'] });
  }

  async fetchOrganizationWithSSOConfigs(slug: string, statusList?: Array<boolean>): Promise<Organization> {
    const conditions: any = {
      relations: ['ssoConfigs'],
      where: {
        ssoConfigs: {
          enabled: statusList ? In(statusList) : In([true, false]),
        },
      },
    };
    let organization: Organization;
    try {
      organization = await this.manager.findOneOrFail(Organization, {
        ...conditions,
        where: { ...conditions.where, slug },
      });
    } catch (error) {
      organization = await this.manager.findOneOrFail(Organization, {
        ...conditions,
        where: { ...conditions.where, id: slug },
      });
    }
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
      throw new BadRequestException('Organization is Archived');
    return organization;
  }

  async findOrganizationWithLoginSupport(
    user: User,
    loginType: string,
    status?: string | Array<string>
  ): Promise<Organization[]> {
    const statusList = status ? (Array.isArray(status) ? status : [status]) : [WORKSPACE_USER_STATUS.ACTIVE];

    const conditions: any = {
      organizationUsers: {
        status: In(statusList),
        userId: user.id,
      },
    };

    if (!isSuperAdmin(user)) {
      if (loginType === 'form') {
        conditions.ssoConfigs = { sso: 'form', enabled: true };
      } else if (loginType === 'sso') {
        conditions.inheritSSO = true;
      } else {
        return [];
      }
    }

    return await this.manager.find(Organization, {
      relations: ['ssoConfigs', 'organizationUsers'],
      where: conditions,
      order: {
        name: 'ASC',
      },
    });
  }

  async fetchOrganization(slug: string, manager?: EntityManager): Promise<Organization> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const select: FindOptionsSelect<Organization> = { id: true, slug: true, name: true, status: true };
      let organization: Organization;
      try {
        organization = await manager.findOneOrFail(Organization, {
          where: { slug },
          select,
        });
      } catch (error) {
        organization = await manager.findOneOrFail(Organization, {
          where: { id: slug },
          select,
        });
      }
      if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
        throw new BadRequestException('Organization is Archived');
      return organization;
    }, manager || this.manager);
  }

  updateOne(id: string, updatableData: Partial<Organization>, manager?: EntityManager): Promise<any> {
    return dbTransactionWrap((manager: EntityManager) => {
      return catchDbException(() => {
        return manager.update(Organization, id, updatableData);
      }, CONSTRAINTS);
    }, manager);
  }

  createOne(organizationInputs: OrganizationInputs, manager?: EntityManager): Promise<any> {
    const { name, slug, isDefault } = organizationInputs;
    return dbTransactionWrap((manager: EntityManager) => {
      return catchDbException(() => {
        return manager.save(
          manager.create(Organization, {
            ssoConfigs: [
              {
                sso: SSOType.FORM,
                enabled: true,
                configScope: ConfigScope.ORGANIZATION,
              },
            ],
            name,
            slug,
            isDefault,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
      }, CONSTRAINTS);
    }, manager || this.manager);
  }

  async fetchOrganizationsForSuperAdmin(
    status: string,
    currentPage?: number,
    perPageCount?: number,
    name?: string
  ): Promise<{ organizations: Organization[]; totalCount: number }> {
    const findOptions: FindManyOptions<Organization> = {
      order: { name: 'ASC' },
      where: {
        status: status,
        ...(name ? { name: ILike(`%${name}%`) } : {}),
      },
    };

    if (currentPage && perPageCount > 0) {
      findOptions.skip = (currentPage - 1) * perPageCount;
      findOptions.take = perPageCount;
    }

    const [organizations, totalCount] = await this.findAndCount(findOptions);
    return { organizations, totalCount };
  }

  async fetchOrganizationsForRegularUser(
    user: User,
    status: string,
    currentPage?: number,
    perPageCount?: number,
    name?: string,
    manager?: EntityManager
  ): Promise<{ organizations: Organization[]; totalCount: number }> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const whereClause: any = {
        status,
        organizationUsers: {
          userId: user.id,
          status: WORKSPACE_USER_STATUS.ACTIVE,
        },
      };

      if (name) {
        whereClause.name = ILike(`%${name}%`);
      }

      const [organizations, totalCount] = await manager.findAndCount(Organization, {
        where: whereClause,
        relations: ['organizationUsers'],
        order: {
          name: 'ASC',
        },
        skip: currentPage && perPageCount ? (currentPage - 1) * perPageCount : undefined,
        take: isNaN(perPageCount) ? undefined : perPageCount,
      });

      return { organizations, totalCount };
    }, manager || this.manager);
  }
  getSingleOrganization(): Promise<Organization> {
    /* TypeORM won't allow to find one without where clause */
    return this.findOne({
      where: {
        id: undefined,
      },
    });
  }

  async getSingleOrganizationWithId(orgId: string): Promise<Organization> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager.findOne(Organization, {
        where: { id: orgId },
      });
    });
  }

  async getDefaultWorkspaceOfInstance(): Promise<Organization>{
    return dbTransactionWrap(async (manager: EntityManager) => {
      try {
        return await manager.findOneOrFail(Organization, {
          where: { isDefault: true },
        });
      } catch (error) {
        console.error('No default workspace in this instance');
        return null;
      }      
    });
  }

  async changeDefaultWorkspace(organizationId: string, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // First, unset any existing default workspace
      await manager.update(Organization, { isDefault: true }, { isDefault: false });
      
      // Then set the new default workspace
      await manager.update(Organization, { id: organizationId }, { isDefault: true });
    }, manager || this.manager);
  }
}
