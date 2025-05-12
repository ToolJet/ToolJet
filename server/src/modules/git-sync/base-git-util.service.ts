/**
 * Base utility service for Git operations across all source control providers.
 *
 * @remarks
 * DEPENDENCY INJECTION: Only inject platform-common services (Licensing, Import/Export).
 * Provider-specific implementations (GitHub, GitLab) must be injected in respective util.service.
 *
 * METHODS: Include only DB interactions and common functionalities applicable to all source controls.
 * No provider-specific logic.
 */
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { AppGitPushDto } from '@modules/app-git/dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseGitUtilService {
  constructor() {}

  async findAppGitById(appGitId: string): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }

  async findAppGitByAppId(appId: string): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }

  async getOrganizationById(userOrganizationId: string, organizationId: string): Promise<OrganizationGitSync> {
    throw new Error('Method not implemented.');
  }

  async createAppGit(CreateBody: any): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }

  async WriteAppFile(user: User, repoPath: string, appGit: AppGitSync, version: AppVersion, app: App): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async writeMetaFile(
    user: User,
    repoPath: string,
    appGit: AppGitSync,
    appGitPushBody: AppGitPushDto
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async readAppJson(user: User, appName: string, versionName: string, gitRepoPath: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async UpdateGitApp(schemaUnifiedAppParam: any, app: App): Promise<App> {
    throw new Error('Method not implemented.');
  }

  async updateAppGit(appGitId: string, UpdateBody: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  validateAppJsonForImport(appJson: any, appName: string): any {
    throw new Error('Method not implemented.');
  }

  async updateGitSyncSettings(
    organizationId: string,
    id: string,
    autoCommit: boolean,
    isEnabled: boolean
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
