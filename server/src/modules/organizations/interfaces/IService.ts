import { Organization } from 'src/entities/organization.entity';
import { OrganizationUpdateDto, OrganizationStatusUpdateDto } from '@modules/organizations/dto';
import { EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';
import {
  ListWorkspacesV2QueryDto,
  ListWorkspacesV2ResponseDto,
  UpdateWorkspaceV2Dto,
  WorkspaceV2ResponseDto,
} from '@modules/organizations/dto/v2';

export interface IOrganizationsService {
  fetchOrganizations(
    user: any,
    status?: string,
    currentPage?: number,
    perPageCount?: number,
    name?: string
  ): Promise<{ organizations: Organization[]; totalCount: number }>;

  updateOrganizationNameAndSlug(user: User, updatableData: OrganizationUpdateDto): Promise<Organization>;

  updateOrganizationStatus(
    organizationId: string,
    updatableData: OrganizationStatusUpdateDto,
    user?: User,
    manager?: EntityManager
  ): Promise<Organization>;

  checkWorkspaceUniqueness(name: string, slug: string): Promise<void>;

  checkWorkspaceNameUniqueness(name: string): Promise<void>;

  setDefaultWorkspace(organizationId: string, manager?: EntityManager): Promise<void>;

  updateWorkspace(
    organizationId: string,
    changes: Partial<Pick<Organization, 'name' | 'slug' | 'status'>>,
    manager?: EntityManager
  ): Promise<void>;

  listWorkspacesV2(query: ListWorkspacesV2QueryDto, viewer?: User): Promise<ListWorkspacesV2ResponseDto>;

  getWorkspaceV2(identifier: string, viewer?: User): Promise<WorkspaceV2ResponseDto>;

  updateWorkspaceV2(identifier: string, dto: UpdateWorkspaceV2Dto): Promise<WorkspaceV2ResponseDto>;

  archiveWorkspaceV2(identifier: string): Promise<void>;

  unarchiveWorkspaceV2(identifier: string): Promise<void>;

  setDefaultWorkspaceV2(identifier: string): Promise<void>;

  checkWorkspaceFieldsAvailableV2(
    fields: { name?: string; slug?: string },
    current?: Pick<Organization, 'name' | 'slug'>
  ): Promise<void>;
}

export class OrganizationWithPlan extends Organization {
  plan: string;
  license_type: string;
  custom_domain: string;
}
