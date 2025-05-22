import { User } from 'src/entities/user.entity';
import { OrganizationUpdateDto, OrganizationStatusUpdateDto } from '@modules/organizations/dto';

export interface IOrganizationsController {
  get(user: User, status: string, currentPage: number, perPageCount: number, name: string): Promise<any>;

  updateOrganizationNameAndSlug(organizationUpdateDto: OrganizationUpdateDto, user: User): Promise<void>;

  updateById(organizationUpdateDto: OrganizationStatusUpdateDto, organizationId: string): Promise<void>;

  checkWorkspaceUnique(name: string, slug: string): Promise<void>;

  checkUniqueWorkspaceName(name: string): Promise<void>;

  setDefaultWorkspace(id: string): Promise<void>;
}
