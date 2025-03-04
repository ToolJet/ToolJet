import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { App } from 'src/entities/app.entity';
import { GitConfig } from './IService';

export interface IAppGitUtilService {
  findAppGitById(appGitId: string): Promise<AppGitSync>;
  findAppGitByAppId(appId: string): Promise<AppGitSync>;
  createAppGit(CreateBody: any): Promise<AppGitSync>;
  updateAppGit(appGitId: string, UpdateBody: any): Promise<any>;

  gitPushApp(
    user: User,
    appGitId: string,
    branchName: string,
    appGitPushBody: AppGitPushDto,
    version: AppVersion,
    remoteName?: string
  ): Promise<any>;

  renameAppOrVersion(
    user: User,
    appId: string,
    prevName: string,
    updatedName: string,
    renameVersionFlag: boolean,
    remoteName: string
  ): Promise<any>;

  UpdateGitApp(schemaUnifiedAppParam: any, app: App, user: User): Promise<any>;

  readAppJson(user: User, appName: string, versionName: string, gitRepoPath: string): Promise<any>;

  validateAppJsonForImport(appJson: any, appName: string): Promise<any>;

  getAppVersionByVersionId(appGitPushBody: AppGitPushDto): Promise<any>;
  getAppVersionById(versionId: string): Promise<any>;

  generateSSHKeyPair(): Promise<{ publicKey: string; privateKey: string }>;
  validateGitConfig(config: GitConfig): Promise<boolean>;
  parseGitUrl(remoteUrl: string): { owner: string; repo: string } | null;
}
