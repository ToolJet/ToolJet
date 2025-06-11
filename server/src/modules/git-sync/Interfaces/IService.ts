import { ProviderConfigDTO } from '@modules/git-sync/dto/provider-config.dto';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto, OrganizationGitStatusUpdateDto } from '../dto';

export interface IGitSyncService {
  deleteConfig(organizationId: string, organizationGit: string, gitType: string): Promise<void>;

  createOrganizationGit(organizationGitCreateDto: OrganizationGitCreateDto, userOrganizationId: string): Promise<any>;

  updateOrgGit(
    userOrganizationId: string,
    organizationId: string,
    updateOrgGitDto: OrganizationGitUpdateDto,
    gitType: string
  ): Promise<void>;

  updateOrgGitStatus(
    organizationId: string,
    id: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void>;

  setFinalizeConfig(
    userId: string,
    organizationId: string,
    organizationGitId: string,
    gitType: string,
    configDate: ProviderConfigDTO
  ): Promise<void>;

  getOrganizationById(userOrganizationId: string, organizationId: string, gitType: string): Promise<any>;

  getOrgGitStatusById(userOrganizationId: string, organizationId: string): Promise<any>;
}
