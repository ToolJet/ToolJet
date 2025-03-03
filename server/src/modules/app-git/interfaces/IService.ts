import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';
import { App } from '@entities/app.entity';

export interface GitConfig {
  remoteUrl: string;
  branch: string;
  gitToken?: string;
  publicKey?: string;
  sshKey?: string;
}

export interface GitSyncOptions {
  remoteUrl: string;
  branch: string;
  gitToken?: string;
  publicKey?: string;
  sshKey?: string;
  pullBeforePush?: boolean;
  authorName?: string;
  authorEmail?: string;
}

export interface IAppGitService {
  checkSyncApp(user: User, versionId: string, organizationId: string): Promise<any>;

  syncApp(appGitPushBody: AppGitPushDto, user: User, appGitId: string): Promise<any>;

  gitPullAppInfo(user: User, appId?: string): Promise<any>;

  createGitApp(user: User, appMetaBody: AppGitPullDto): Promise<any>;

  pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<any>;

  setupRepository(app: App, options: GitSyncOptions, user: User): Promise<void>;

  pullChanges(app: App, options: GitSyncOptions, user: User): Promise<any>;

  pushChanges(app: App, options: GitSyncOptions, user: User, commitMessage?: string): Promise<any>;

  getStatus(app: App, options: GitSyncOptions): Promise<any>;

  getRemoteUrl(app: App): Promise<string | null>;

  getConfig(app: App): Promise<GitConfig | null>;
}
