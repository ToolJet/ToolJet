import {
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  NotImplementedException,
  Optional,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { isSuperAdmin } from 'src/helpers/utils.helper';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationStatusUpdateDto, OrganizationUpdateDto } from '@modules/organizations/dto';
import { IOrganizationsService } from '@modules/organizations/interfaces/IService';
import { LicenseOrganizationService } from '@modules/licensing/services/organization.service';
import { WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from '@modules/users/constants/lifecycle';
import { User } from '@entities/user.entity';
import { RequestContext } from '@modules/request-context/service';
import { AUDIT_LOGS_REQUEST_CONTEXT_KEY } from '@modules/app/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { OrganizationWithPlan } from '@modules/organizations/interfaces/IService';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from 'src/helpers/utils.helper';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { CustomDomainRepository } from '@modules/custom-domains/repository';
import { OrganizationUser } from '@entities/organization_user.entity';
import {
  ListWorkspacesV2QueryDto,
  ListWorkspacesV2ResponseDto,
  UpdateWorkspaceV2Dto,
  WorkspaceV2ResponseDto,
  toWorkspaceV2Response,
} from '@modules/organizations/dto/v2';

export type WorkspaceChanges = Partial<Pick<Organization, 'name' | 'slug' | 'status'>>;

const DEFAULT_CANNOT_BE_ARCHIVED = 'The default workspace cannot be archived — mark another workspace as default first';

// The dashboard answers 406 when the default workspace would be archived; the v2 contract answers 409.
const asV2Conflict = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    if (error instanceof NotAcceptableException) throw new ConflictException(DEFAULT_CANNOT_BE_ARCHIVED);
    throw error;
  }
};

const isScopedViewer = (viewer?: User): viewer is User => !!viewer && !isSuperAdmin(viewer);

@Injectable()
export class OrganizationsService implements IOrganizationsService {
  constructor(
    protected organizationRepository: OrganizationRepository,
    protected readonly licenseOrganizationService: LicenseOrganizationService,
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly licenseUserService: LicenseUserService,
    @Optional() protected readonly customDomainRepository: CustomDomainRepository
  ) {}

  async fetchOrganizations(
    user: any,
    status = WORKSPACE_STATUS.ACTIVE,
    currentPage?: number,
    perPageCount?: number,
    name?: string
  ): Promise<{ organizations: OrganizationWithPlan[] | Organization[]; totalCount: number }> {
    let organizations: Organization[];
    let totalCount: number;

    if (isSuperAdmin(user)) {
      ({ organizations, totalCount } = await this.organizationRepository.fetchOrganizationsForSuperAdmin(
        status,
        currentPage,
        perPageCount,
        name
      ));
    } else {
      ({ organizations, totalCount } = await this.organizationRepository.fetchOrganizationsForRegularUser(
        user,
        status,
        currentPage,
        perPageCount,
        name
      ));
    }

    const edition = getTooljetEdition();
    let updatedOrganizations: OrganizationWithPlan[] | Organization[] = organizations;

    if (edition === TOOLJET_EDITIONS.Cloud) {
      const orgIds = organizations.map((o) => o.id);
      const activeDomains = this.customDomainRepository
        ? await this.customDomainRepository.find({
            where: { organizationId: In(orgIds), status: 'active' },
          })
        : [];
      const domainMap = new Map(activeDomains.map((d) => [d.organizationId, d.domain]));

      //For organization license tags
      updatedOrganizations = await Promise.all(
        organizations.map(async (org) => {
          const licensePlan = await this.licenseTermsService.getLicenseTerms(
            [LICENSE_FIELD.PLAN, LICENSE_FIELD.STATUS],
            org.id
          );
          const orgWithPlan = new OrganizationWithPlan();
          Object.assign(orgWithPlan, org);
          orgWithPlan.plan = licensePlan?.plan;
          orgWithPlan.license_type = licensePlan?.status;
          orgWithPlan.custom_domain = domainMap.get(org.id) || null;

          return orgWithPlan;
        })
      );
    }

    return { organizations: updatedOrganizations, totalCount };
  }

  async updateOrganizationNameAndSlug(user: User, updatableData: OrganizationUpdateDto): Promise<Organization> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const organizationId = user.organizationId;
      const organization = await manager.findOne(Organization, { where: { id: organizationId } });
      await this.updateWorkspace(organizationId, updatableData, manager);

      //WORKSPACE_UPDATE audit
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: organizationId,
        resourceName: organization.name,
        resourceData: {
          previous_workspace_details: {
            id: organizationId,
            name: organization.name,
            slug: organization.slug,
          },
          updated_workspace_details: {
            id: organizationId,
            name: updatableData.name,
            slug: updatableData.slug,
          },
        },
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
    });

    return;
  }

  async updateOrganizationStatus(
    organizationId: string,
    updatableData: OrganizationStatusUpdateDto,
    user?: User,
    manager?: EntityManager
  ): Promise<Organization> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await manager.findOne(Organization, { where: { id: organizationId } });
      if (organization.isDefault) {
        throw new NotAcceptableException('Default workspace cannot be archived');
      }

      await this.updateWorkspace(organizationId, { status: updatableData.status }, manager);

      //WORKSPACE_ARCHIVE audit WORKSPACE_UNARCHIVE audit
      const resourceData =
        updatableData.status === WORKSPACE_STATUS.ACTIVE
          ? {
              unarchived_workspace: {
                id: organizationId,
                name: organization.name,
              },
            }
          : {
              archived_workspace: {
                id: organizationId,
                name: organization.name,
              },
            };

      if (!user) return;
      const auditLogsData = {
        userId: user.id,
        organizationId: organizationId,
        resourceId: organizationId,
        resourceName: organization.name,
        resourceData: resourceData,
      };
      RequestContext.setLocals(AUDIT_LOGS_REQUEST_CONTEXT_KEY, auditLogsData);
      return;
    }, manager);
  }

  async updateWorkspace(organizationId: string, changes: WorkspaceChanges, manager?: EntityManager): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const updatable: WorkspaceChanges = {};
      if (changes.name !== undefined) updatable.name = changes.name;
      if (changes.slug !== undefined) updatable.slug = changes.slug;
      if (changes.status !== undefined) updatable.status = changes.status;
      if (Object.keys(updatable).length === 0) return;

      await this.organizationRepository.updateOne(organizationId, updatable, manager);
      if (updatable.status === WORKSPACE_STATUS.ACTIVE) {
        await this.licenseOrganizationService.validateOrganization(manager, organizationId);
        await this.licenseUserService.validateUser(manager, organizationId);
      }
    }, manager);
  }

  async checkWorkspaceUniqueness(name: string, slug: string) {
    if (!(slug || name)) {
      throw new NotAcceptableException('Request should contain the slug or name');
    }
    const result = await this.organizationRepository.findOne({
      where: {
        ...(name && { name }),
        ...(slug && { slug }),
      },
    });
    if (result) throw new ConflictException(`Workspace ${name ? 'name' : 'slug'} already exists`);
    return;
  }

  async checkWorkspaceNameUniqueness(name: string) {
    if (!name) {
      throw new NotAcceptableException('Request should contain workspace name');
    }
    const result = await this.organizationRepository.count({
      where: {
        ...(name && { name }),
      },
    });
    if (result) throw new ConflictException('Workspace name must be unique');
    return;
  }

  async setDefaultWorkspace(organizationId: string, manager?: EntityManager): Promise<void> {
    throw new NotImplementedException('This feature is only available in Enterprise Edition');
  }

  async listWorkspacesV2(query: ListWorkspacesV2QueryDto, viewer?: User): Promise<ListWorkspacesV2ResponseDto> {
    const page = query.page ?? 1;
    const perPage = query.per_page ?? 20;
    const { organizations, totalCount } = await this.organizationRepository.queryWorkspaces({
      status: query.status,
      search: query.search,
      isDefault: query.default,
      memberUserId: isScopedViewer(viewer) ? viewer.id : undefined,
      page,
      perPage,
    });
    return plainToInstance(ListWorkspacesV2ResponseDto, {
      data: organizations.map(toWorkspaceV2Response),
      pagination: { page, per_page: perPage, total_count: totalCount },
    });
  }

  async getWorkspaceV2(identifier: string, viewer?: User): Promise<WorkspaceV2ResponseDto> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await this.organizationRepository.findByIdentifier(identifier, manager);
      if (isScopedViewer(viewer)) {
        const membership = await manager.findOne(OrganizationUser, {
          where: { userId: viewer.id, organizationId: organization.id, status: WORKSPACE_USER_STATUS.ACTIVE },
        });
        // Not found rather than forbidden, so a token can't probe which workspaces exist.
        if (!membership) throw new NotFoundException('Workspace not found');
      }
      return toWorkspaceV2Response(organization);
    });
  }

  async updateWorkspaceV2(identifier: string, dto: UpdateWorkspaceV2Dto): Promise<WorkspaceV2ResponseDto> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await this.organizationRepository.findByIdentifier(identifier, manager);

      if (dto.default === false) {
        throw new UnprocessableEntityException(
          'default cannot be set to false directly — make a different workspace the default instead'
        );
      }
      if (dto.default === true && (dto.status ?? organization.status) === WORKSPACE_STATUS.ARCHIVE) {
        throw new UnprocessableEntityException('An archived workspace cannot be made the default');
      }

      await this.checkWorkspaceFieldsAvailableV2(dto, organization);
      await this.updateWorkspace(organization.id, { name: dto.name, slug: dto.slug }, manager);
      if (dto.status !== undefined && dto.status !== organization.status) {
        await asV2Conflict(() =>
          this.updateOrganizationStatus(organization.id, { status: dto.status }, undefined, manager)
        );
      }
      if (dto.default === true && !organization.isDefault) {
        await this.setDefaultWorkspace(organization.id, manager);
      }

      return toWorkspaceV2Response(await manager.findOneOrFail(Organization, { where: { id: organization.id } }));
    });
  }

  async archiveWorkspaceV2(identifier: string): Promise<void> {
    return this.#changeWorkspaceStatusV2(identifier, WORKSPACE_STATUS.ARCHIVE);
  }

  async unarchiveWorkspaceV2(identifier: string): Promise<void> {
    return this.#changeWorkspaceStatusV2(identifier, WORKSPACE_STATUS.ACTIVE);
  }

  async setDefaultWorkspaceV2(identifier: string): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await this.organizationRepository.findByIdentifier(identifier, manager);
      if (organization.isDefault) {
        throw new ConflictException('Workspace is already the default workspace');
      }
      if (organization.status === WORKSPACE_STATUS.ARCHIVE) {
        throw new UnprocessableEntityException('An archived workspace cannot be made the default');
      }
      await this.setDefaultWorkspace(organization.id, manager);
    });
  }

  async #changeWorkspaceStatusV2(identifier: string, status: WORKSPACE_STATUS): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const organization = await this.organizationRepository.findByIdentifier(identifier, manager);
      if (organization.status === status) {
        throw new ConflictException(`Workspace is already ${status}`);
      }
      await asV2Conflict(() => this.updateOrganizationStatus(organization.id, { status }, undefined, manager));
    });
  }

  // One field per call: checkWorkspaceUniqueness matches name AND slug together.
  async checkWorkspaceFieldsAvailableV2(
    { name, slug }: { name?: string; slug?: string },
    current?: Pick<Organization, 'name' | 'slug'>
  ): Promise<void> {
    if (name !== undefined && name !== current?.name) await this.checkWorkspaceUniqueness(name, undefined);
    if (slug !== undefined && slug !== current?.slug) await this.checkWorkspaceUniqueness(undefined, slug);
  }
}
