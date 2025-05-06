import { AppGitPushDto, AppGitPullDto, AppGitPullUpdateDto } from '@modules/app-git/dto';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto } from '@dto/organization_git.dto';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { User } from 'src/entities/user.entity';
import { ProviderConfigDTO } from '../dto/provider-config.dto';
import { RenameAppOrVersionDto } from '../dto/rename-app.dto';
export interface IGithubSSHServiceInterface {
  checkSyncApp(user: User, version: AppVersion, organizationId: string): Promise<any>;
  gitPullAppInfo(user: User, appId?: string): Promise<any>;
  createGitApp(user: User, appMetaBody: AppGitPullDto): Promise<App>;
  gitPushApp(
    user: User,
    appGitId: string,
    appGitPushBody: AppGitPushDto,
    version: AppVersion,
    remoteName?: string
  ): Promise<void>;
  renameAppOrVersion(user: User, appId: string, renameAppOrVersion: RenameAppOrVersionDto): Promise<any>;
  pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<App>;
  setFinalizeConfig(userId: string, organizationId: string, organizationGitId: string): Promise<OrganizationGitSync>;
  createOrganizationGit(organizationGitCreateDto: OrganizationGitCreateDto): Promise<OrganizationGitSync>;
  updateOrgGit(organizationId: string, id: string, updateOrgGitDto: OrganizationGitUpdateDto): Promise<void>;
  saveProviderConfig(userId: string, organizationId: string, configData: ProviderConfigDTO): Promise<void>;
  getProviderConfigs(userOrganizationId: string, organizationId: string): Promise<any>;
  deleteConfig(organizationId: string, organizationGitId: string): Promise<void>;
}
