import { Injectable } from '@nestjs/common';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto } from '@dto/organization_git.dto';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { User } from 'src/entities/user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { AppGitPushDto, AppGitPullDto, AppGitPullUpdateDto } from '@modules/app-git/dto';
import { App } from 'src/entities/app.entity';
import { IGithubSSHServiceInterface } from './ssh-service.interface';
import { ProviderConfigDTO } from '../dto/provider-config.dto';
import { OrganizationGitSshConfigDto } from '../dto/organization-git-provider.dto';
import { RenameAppOrVersionDto } from '../dto/rename-app.dto';
import { BaseGitSyncService } from '@modules/git-sync/base-git.service';

@Injectable()
export class SSHGitSyncService extends BaseGitSyncService implements IGithubSSHServiceInterface {
  constructor() {
    super();
  }

  async checkSyncApp(user: User, version: AppVersion, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async gitPullAppInfo(user: User, appId?: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createGitApp(user: User, appMetaBody: AppGitPullDto): Promise<App> {
    throw new Error('Method not implemented.');
  }

  async gitPushApp(
    user: User,
    appGitId: string,
    appGitPushBody: AppGitPushDto,
    version: AppVersion,
    remoteName?: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async renameAppOrVersion(user: User, appId: string, renameAppOrVersionDto: RenameAppOrVersionDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<App> {
    throw new Error('Method not implemented.');
  }

  async setFinalizeConfig(
    userId: string,
    organizationId: string,
    organizationGitId: string
  ): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async createOrganizationGit(organizationGitCreateDto: OrganizationGitCreateDto): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async updateOrgGit(organizationId: string, id: string, updateOrgGitDto: OrganizationGitUpdateDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getProviderConfigs(userOrganizationId: string, organizationId: string): Promise<OrganizationGitSshConfigDto> {
    throw new Error('Method not implemented.');
  }

  async getOrgGitStatusById(userOrganizationId: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async deleteConfig(organizationId: string, organizationGitId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async saveProviderConfig(userId: string, organizationId: string, configData: ProviderConfigDTO): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
