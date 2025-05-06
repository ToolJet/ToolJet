import { OrganizationGitSync } from '../../../entities/organization_git_sync.entity';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto, OrganizationGitStatusUpdateDto } from '../dto';

export interface IGitSyncService {
  deleteConfig(organizationId: string, organizationGit: string): Promise<void>;

  createOrganizationGit(organizationGitCreateDto: OrganizationGitCreateDto): Promise<OrganizationGitSync>;

  updateOrgGit(organizationId: string, id: string, updateOrgGitDto: OrganizationGitUpdateDto): Promise<void>;

  updateOrgGitStatus(
    organizationId: string,
    id: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void>;

  setFinalizeConfig(userId: string, organizationId: string, organizationGitId: string): Promise<void>;

  getOrganizationById(userOrganizationId: string, organizationId: string): Promise<any>;

  getOrgGitStatusById(userOrganizationId: string, organizationId: string): Promise<any>;
}
