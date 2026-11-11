import { updateSecurityEntity } from '@modules/mcp-oauth/revocation';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOptionsSelect,
  ILike,
  In,
  LessThan,
  Repository,
} from 'typeorm';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { WorkspaceBanList } from '@entities/workspace_ban_list.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { catchDbException, isSuperAdmin } from '@helpers/utils.helper';
import { ConfigScope, SSOType } from '@entities/sso_config.entity';
import { WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { CONSTRAINTS } from './constants';
import { OrganizationInputs } from '@modules/setup-organization/types/organization-inputs';

const LAST_ACCESSED_AT_UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface WorkspaceQuery {
  status?: string;
  search?: string;
  isDefault?: boolean;
  memberUserId?: string;
  page: number;
  perPage: number;
}

@Injectable()
export class OrganizationRepository extends Repository<Organization> {
  constructor(private dataSource: DataSource) {
    super(Organization, dataSource.createEntityManager());
  }

  async get(id: string): Promise<Organization> {
    return await this.findOne({ where: { id }, relations: ['ssoConfigs'] });
  }

  async fetchOrganizationWithSSOConfigs(
    slug: string,
    statusList?: Array<boolean>,
    allowArchivedWorkspace: boolean = false
  ): Promise<Organization> {
    const conditions: any = {
      relations: ['ssoConfigs', 'ssoConfigs.oidcGroupSyncs'],
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
    } catch {
      organization = await this.manager.findOneOrFail(Organization, {
        ...conditions,
        where: { ...conditions.where, id: slug },
      });
    }
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE && !allowArchivedWorkspace)
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
    const m = manager ?? this.manager;
    const select: FindOptionsSelect<Organization> = { id: true, slug: true, name: true, status: true };
    let organization: Organization;
    try {
      organization = await m.findOneOrFail(Organization, { where: { slug }, select });
    } catch {
      organization = await m.findOneOrFail(Organization, { where: { id: slug }, select });
    }
    if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE) {
      const banned = await m.findOne(WorkspaceBanList, { where: { organizationId: organization.id } });
      if (banned) {
        throw new ForbiddenException({
          message: JSON.stringify({ errorType: 'WORKSPACE_BANNED', workspaceName: organization.name }),
        });
      }
      throw new BadRequestException('Organization is Archived');
    }
    return organization;
  }

  // Resolves a workspace by id, then slug, then name.
  async findByIdentifier(identifier: string, manager?: EntityManager): Promise<Organization> {
    const m = manager ?? this.manager;
    const isUuid = UUID_PATTERN.test(identifier);
    let organization = await m.findOne(Organization, { where: isUuid ? { id: identifier } : { slug: identifier } });
    if (!organization && !isUuid) {
      organization = await m.findOne(Organization, { where: { name: identifier } });
    }
    if (!organization) throw new NotFoundException('Workspace not found');
    return organization;
  }

  async queryWorkspaces(
    query: WorkspaceQuery,
    manager?: EntityManager
  ): Promise<{ organizations: Organization[]; totalCount: number }> {
    const qb = (manager ?? this.manager).createQueryBuilder(Organization, 'organization');
    if (query.memberUserId) {
      qb.innerJoin(
        'organization.organizationUsers',
        'membership',
        'membership.userId = :memberUserId AND membership.status = :membershipStatus',
        { memberUserId: query.memberUserId, membershipStatus: WORKSPACE_USER_STATUS.ACTIVE }
      );
    }
    if (query.search) {
      qb.andWhere('(organization.name ILIKE :search OR organization.slug ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query.status) qb.andWhere('organization.status = :status', { status: query.status });
    if (query.isDefault !== undefined)
      qb.andWhere('organization.isDefault = :isDefault', { isDefault: query.isDefault });

    const [organizations, totalCount] = await qb
      .orderBy('organization.createdAt', 'DESC')
      .skip((query.page - 1) * query.perPage)
      .take(query.perPage)
      .getManyAndCount();
    return { organizations, totalCount };
  }

  updateOne(id: string, updatableData: Partial<Organization>, manager?: EntityManager): Promise<any> {
    return dbTransactionWrap((manager: EntityManager) => {
      return catchDbException(() => {
        return updateSecurityEntity(manager, Organization, id, updatableData);
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
    const m = manager ?? this.manager;
    const whereClause: any = {
      status,
      organizationUsers: { userId: user.id, status: WORKSPACE_USER_STATUS.ACTIVE },
    };
    if (name) whereClause.name = ILike(`%${name}%`);

    const [organizations, totalCount] = await m.findAndCount(Organization, {
      where: whereClause,
      relations: ['organizationUsers'],
      order: { name: 'ASC' },
      skip: currentPage && perPageCount ? (currentPage - 1) * perPageCount : undefined,
      take: isNaN(perPageCount) ? undefined : perPageCount,
    });
    return { organizations, totalCount };
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
    return this.manager.findOne(Organization, { where: { id: orgId } });
  }

  async getDefaultWorkspaceOfInstance(): Promise<Organization> {
    try {
      return await this.manager.findOneOrFail(Organization, { where: { isDefault: true } });
    } catch {
      console.error('No default workspace in this instance');
      return null;
    }
  }

  async changeDefaultWorkspace(organizationId: string, manager?: EntityManager): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // First, unset any existing default workspace
      await updateSecurityEntity(manager, Organization, { isDefault: true }, { isDefault: false });

      // Then set the new default workspace
      await updateSecurityEntity(manager, Organization, { id: organizationId }, { isDefault: true });
    }, manager || this.manager);
  }

  touchLastAccessedAt(organizationId: string): void {
    const threshold = new Date(Date.now() - LAST_ACCESSED_AT_UPDATE_INTERVAL_MS);
    this.manager
      .update(Organization, { id: organizationId, lastAccessedAt: LessThan(threshold) }, { lastAccessedAt: new Date() })
      .catch((err) => {
        console.error('error while updating organization last_accessed_at', err);
      });
  }
}
