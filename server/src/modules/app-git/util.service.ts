import { Injectable } from '@nestjs/common';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';
import * as NodeGit from '@figma/nodegit';
import { AppVersion } from 'src/entities/app_version.entity';
import { App } from 'src/entities/app.entity';
import { GitConfig } from './interfaces/IService';
import { IAppGitUtilService } from './interfaces/IUtilService';

@Injectable()
export class AppGitUtilService implements IAppGitUtilService {
  protected static PROJECT_ROOT = 'tooljet/gitsync';
  constructor() {}

  async findAppGitById(appGitId: string): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }

  async findAppGitByAppId(appId: string): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }

  async createAppGit(CreateBody: any): Promise<AppGitSync> {
    throw new Error('Method not implemented.');
  }

  async updateAppGit(appGitId: string, UpdateBody: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async gitPushApp(
    user: User,
    appGitId: string,
    branchName: string,
    appGitPushBody: AppGitPushDto,
    version: AppVersion,
    remoteName = 'origin'
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  protected async WriteAppFile(
    user: User,
    repoPath: string,
    appGit: AppGitSync,
    version: AppVersion,
    app: App
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  //Create a listener for this. If called from app service async
  async renameAppOrVersion(
    user: User,
    appId: string,
    prevName = '',
    renameVersionFlag = false,
    branchName = 'master',
    remoteName = 'origin'
  ): Promise<any> {
    throw new Error('Method not implemented.');
    // This one to be moved to gitsync service,
    // Should pass appGit instead of appGit.id
  }

  protected async pushRepo(
    repo: NodeGit.Repository,
    appGit: AppGitSync,
    branchName: string,
    remoteName: string
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  //Need to work more on this
  protected async gitCommit(
    repo: NodeGit.Repository,
    commitMessage: string,
    commitingUser: User,
    appGit: AppGitSync
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  protected async writeMetaFile(
    user: User,
    repoPath: string,
    appGit: AppGitSync,
    appGitPushBody: AppGitPushDto
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async UpdateGitApp(schemaUnifiedAppParam: any, app: App, user: User): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async readAppJson(user: User, appName: string, versionName: string, gitRepoPath: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  validateAppJsonForImport(appJson, appName): Promise<any> {
    throw new Error('Method not implemented.');
  }

  protected async deleteAppVersions(appVersions: AppVersion[], app: App, user: User): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getAppVersionByVersionId(appGitPushBody: AppGitPushDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getAppVersionById(versionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async generateSSHKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    throw new Error('Method not implemented.');
  }

  async validateGitConfig(config: GitConfig): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  parseGitUrl(remoteUrl: string): { owner: string; repo: string } | null {
    throw new Error('Method not implemented.');
  }
}
