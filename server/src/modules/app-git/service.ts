import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { App } from '@entities/app.entity';
import { GitConfig, GitSyncOptions, IAppGitService } from './interfaces/IService';

@Injectable()
export class AppGitService implements IAppGitService {
  protected static PROJECT_ROOT = 'tooljet/gitsync';
  constructor() {}

  async checkSyncApp(user: User, versionId: string, organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async syncApp(appGitPushBody: AppGitPushDto, user: User, appGitId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async gitPullAppInfo(user: User, appId?: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async createGitApp(user: User, appMetaBody: AppGitPullDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async setupRepository(app: App, options: GitSyncOptions, user: User): Promise<void> {
    // Implementation
    throw new Error('Method not implemented.');
  }

  async pullChanges(app: App, options: GitSyncOptions, user: User): Promise<any> {
    // Implementation
    throw new Error('Method not implemented.');
  }

  async pushChanges(app: App, options: GitSyncOptions, user: User, commitMessage?: string): Promise<any> {
    // Implementation
    throw new Error('Method not implemented.');
  }

  async getStatus(app: App, options: GitSyncOptions): Promise<any> {
    // Implementation
    throw new Error('Method not implemented.');
  }

  async getRemoteUrl(app: App): Promise<string | null> {
    // Implementation
    return null;
    throw new Error('Method not implemented.');
  }

  async getConfig(app: App): Promise<GitConfig | null> {
    // Implementation
    return null;
    throw new Error('Method not implemented.');
  }
}
