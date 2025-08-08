import { User } from 'src/entities/user.entity';
import { OrganizationUpdateDto, OrganizationStatusUpdateDto } from '@modules/organizations/dto';

export interface IOrganizationsController {
  get(user: User, status: string, currentPage: number, perPageCount: number, name: string): Promise<any>;

  updateOrganizationNameAndSlug(organizationUpdateDto: OrganizationUpdateDto, user: User): Promise<void>;

  archiveOrganization(
    organizationUpdateDto: OrganizationStatusUpdateDto,
    organizationId: string,
    user: User
  ): Promise<void>;
  unarchiveOrganization(
    organizationUpdateDto: OrganizationStatusUpdateDto,
    organizationId: string,
    user: User
  ): Promise<void>;

  checkWorkspaceUnique(name: string, slug: string): Promise<void>;

  checkUniqueWorkspaceName(name: string): Promise<void>;

  setDefaultWorkspace(id: string): Promise<void>;
}
