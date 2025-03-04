import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@modules/app-git/dto';

export interface IAppGitController {
  getAppsMetaFile(user: any): Promise<any>;

  gitSyncApp(user: any, appGitId: string, appGitPushBody: AppGitPushDto): Promise<any>;

  getAppMetaFile(user: any, appId: string): Promise<any>;

  getAppConfig(user: any, organizationId: string, versionId: string): Promise<any>;

  createGitApp(user: any, appData: AppGitPullDto): Promise<any>;

  pullGitAppChanges(user: any, appId: string, appData: AppGitPullUpdateDto): Promise<any>;
}
