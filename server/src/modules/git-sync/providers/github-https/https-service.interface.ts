import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { User } from 'src/entities/user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppGitPullDto, AppGitPushDto, AppGitPullUpdateDto } from '@modules/app-git/dto';
import { App } from 'src/entities/app.entity';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto } from '@dto/organization_git.dto';
import { ProviderConfigDTO } from '../dto/provider-config.dto';
import { EntityManager } from 'typeorm';
import { OrganizationGitHttpsConfigDto } from '../dto/organization-git-provider.dto';
import { RenameAppOrVersionDto } from '../dto/rename-app.dto';
export interface IGithubHTTPSServiceInterface {
  saveProviderConfig(userId: string, organizationId: string, configData: any): Promise<any>;
  checkSyncApp(user: User, version: AppVersion, organizationId: string): Promise<any>;
  gitPullAppInfo(user: User, appId?: string);
  createGitApp(user: User, appMetaBody: AppGitPullDto): Promise<App>;
  gitPushApp(
    user: User,
    appGitId: string,
    appGitPushBody: AppGitPushDto,
    version: AppVersion,
    remoteName?: string
  ): Promise<void>;
  renameAppOrVersion(user: User, appId: string, renameAppOrVersionDto: RenameAppOrVersionDto): Promise<any>;
  pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<App>;
  setFinalizeConfig(userId: string, organizationId: string, organizationGitId: string): Promise<OrganizationGitSync>;
  createOrganizationGit(
    organizationGitCreateDto: OrganizationGitCreateDto,
    manager?: EntityManager
  ): Promise<OrganizationGitSync>;
  updateOrgGit(organizationId: string, id: string, updateOrgGitDto: OrganizationGitUpdateDto): Promise<void>;
  saveProviderConfig(userId: string, organizationId: string, configData: ProviderConfigDTO): Promise<void>;
  getProviderConfigs(userOrganizationId: string, organizationId: string): Promise<OrganizationGitHttpsConfigDto>;
  deleteConfig(organizationId: string, organizationGitId: string): Promise<void>;
}
