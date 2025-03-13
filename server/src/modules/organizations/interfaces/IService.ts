import { Organization } from 'src/entities/organization.entity';
import { OrganizationUpdateDto, OrganizationStatusUpdateDto } from '@modules/organizations/dto';

export interface IOrganizationsService {
  fetchOrganizations(
    user: any,
    status?: string,
    currentPage?: number,
    perPageCount?: number,
    name?: string
  ): Promise<{ organizations: Organization[]; totalCount: number }>;

  updateOrganizationNameAndSlug(organizationId: string, updatableData: OrganizationUpdateDto): Promise<Organization>;

  updateOrganizationStatus(organizationId: string, updatableData: OrganizationStatusUpdateDto): Promise<Organization>;

  checkWorkspaceUniqueness(name: string, slug: string): Promise<void>;
}
