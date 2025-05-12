import { IGithubHTTPSServiceInterface } from './https-service.interface';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { OrganizationGitCreateDto } from '@dto/organization_git.dto';
import { OrganizationGitHTTPSUpdateDto } from '@modules/git-sync/dto';
import { AppGitPullDto, AppGitPushDto, AppGitPullUpdateDto } from '@modules/app-git/dto';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { ProviderConfigDTO } from '../dto/provider-config.dto';
import { OrganizationGitHttpsConfigDto } from '../dto/organization-git-provider.dto';
import { RenameAppOrVersionDto } from '../dto/rename-app.dto';
import { BaseGitSyncService } from '@modules/git-sync/base-git.service';

@Injectable()
export class HTTPSGitSyncService extends BaseGitSyncService implements IGithubHTTPSServiceInterface {
  constructor() {
    super();
  }

  async getProviderConfigs(userOrganizationId: string, organizationId: string): Promise<OrganizationGitHttpsConfigDto> {
    throw new Error('Method not implemented.');
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
    organizationGitId: string,
    manager?: EntityManager
  ): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async saveProviderConfig(userId: string, organizationId: string, configData: ProviderConfigDTO): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createOrganizationGit(
    organizationGitCreateDto: OrganizationGitCreateDto,
    manager?: EntityManager
  ): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async getOrgGitStatusById(userOrganizationId: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async updateOrgGit(
    organizationId: string,
    id: string,
    updateOrgGitHTTPSDto: OrganizationGitHTTPSUpdateDto
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async deleteConfig(organizationId: string, organizationGitId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
