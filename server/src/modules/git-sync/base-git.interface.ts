/**
 * Base interface that defines common methods for all Git sync services.
 * All specific Git sync implementations (GitHub, GitLab, AwS Code Commit etc.)
 * must implement these methods.
 */
import { AppGitPushDto } from '@modules/app-git/dto';
export interface IBaseGitSyncInterface {
  getAppVersionById(versionId: string);
  getAppVersionByVersionId(appGitPushBody: AppGitPushDto);
  getProviderConfigs(userOrganizationId: string, organizationId: string): Promise<any>;
}
