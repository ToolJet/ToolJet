/**
 * Base interface that defines common methods for all Git sync services.
 * All specific Git sync implementations (GitHub, GitLab, AwS Code Commit etc.)
 * must implement these methods.
 */
import { AppGitPushDto } from '@modules/app-git/dto';
import { OrganizationGitStatusUpdateDto } from '@dto/organization_git.dto';
export interface IBaseGitSyncInterface {
  updateOrgGitStatus(
    organizationId: string,
    id: string,
    updateOrgGitDto: OrganizationGitStatusUpdateDto
  ): Promise<void>;
  getAppVersionById(versionId: string);
  getAppVersionByVersionId(appGitPushBody: AppGitPushDto);
}
