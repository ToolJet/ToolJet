import { Organization } from 'src/entities/organization.entity';
import { OrganizationUpdateDto, OrganizationStatusUpdateDto } from '@modules/organizations/dto';
import { EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';

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
    user: User
  ): Promise<Organization>;

  checkWorkspaceUniqueness(name: string, slug: string): Promise<void>;

  checkWorkspaceNameUniqueness(name: string): Promise<void>;

  setDefaultWorkspace(organizationId: string, manager?: EntityManager): Promise<void>;
}
