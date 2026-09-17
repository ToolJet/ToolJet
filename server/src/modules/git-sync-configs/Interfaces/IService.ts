import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';

// DB-only operations on organization_git_sync (+ sibling per-provider rows).
// Strategy-side operations (test-connection, finalize, save-provider-configs,
// env-configs finalize) stay in the legacy GitSync module because they require
// network/encryption providers that this module intentionally does not import.
export interface IGitSyncConfigsService {
  getOrgGitByOrgId(userOrganizationId: string, organizationId: string, gitType?: string): Promise<any>;
  getOrgGitStatusById(userOrganizationId: string, organizationId: string): Promise<any>;
  createOrganizationGit(orgGitCreateDto: OrganizationGitCreateDto, userOrganizationId: string): Promise<any>;
  updateOrgGit(
    userOrganizationId: string,
    organizationGitId: string,
    updateOrgGitDto: OrganizationGitUpdateDto,
    gitType: string
  ): Promise<void>;
  updateOrgGitStatus(
    organizationId: string,
    organizationGitId: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void>;
  updateBranchingEnabled(
    userOrganizationId: string,
    organizationGitId: string,
    isBranchingEnabled: boolean
  ): Promise<void>;
  deleteConfig(organizationId: string, organizationGitId: string, gitType: string): Promise<void>;
}
