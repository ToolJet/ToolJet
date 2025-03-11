import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';
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

  gitPullAppInfo(user: User, appId?: string): Promise<any>;

  createGitApp(user: User, appMetaBody: AppGitPullDto): Promise<any>;

  pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<any>;

  syncApp(appGitPushBody: AppGitPushDto, user: User, appGitId: string): Promise<any>;
}
