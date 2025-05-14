// import { Injectable } from '@nestjs/common';
// import { User } from 'src/entities/user.entity';
// import { AppGitSync } from 'src/entities/app_git_sync.entity';
// import { AppGitPushDto } from '@modules/app-git/dto';
// import { AppVersion } from 'src/entities/app_version.entity';
// import { App } from 'src/entities/app.entity';
// import { EntityManager } from 'typeorm';
// import * as NodeGit from '@figma/nodegit';
// import { OrganizationGitSsh } from '@entities/gitsync_entities/organization_git_ssh.entity';

// @Injectable()
// export class AppGitUtilService {
//   async findAppGitById(appGitId: string): Promise<AppGitSync> {
//     throw new Error('Method not implemented.');
//   }

//   async findAppGitByAppId(appId: string): Promise<AppGitSync> {
//     throw new Error('Method not implemented.');
//   }

//   async createAppGit(CreateBody: any): Promise<AppGitSync> {
//     throw new Error('Method not implemented.');
//   }

//   async updateAppGit(appGitId: string, UpdateBody: any) {
//     throw new Error('Method not implemented.');
//   }

//   async gitPushApp(
//     user: User,
//     appGitId: string,
//     branchName: string,
//     appGitPushBody: AppGitPushDto,
//     version: AppVersion,
//     remoteName = 'origin'
//   ) {
//     throw new Error('Method not implemented.');
//   }

//   async renameAppOrVersion(
//     user: User,
//     appId: string,
//     prevName = '',
//     renameVersionFlag = false,
//     branchName = 'master',
//     remoteName = 'origin'
//   ) {
//     throw new Error('Method not implemented.');
//   }

//   async pushRepo(repo: NodeGit.Repository, appGit: AppGitSync, branchName: string, remoteName: string) {
//     throw new Error('Method not implemented.');
//   }

//   async findSSHConfigs(orgGitId: string, manager?: EntityManager): Promise<OrganizationGitSsh> {
//     throw new Error('Method not implemented.');
//   }

//   async UpdateGitApp(schemaUnifiedAppParam: any, app: App, user: User) {
//     throw new Error('Method not implemented.');
//   }

//   async readAppJson(user: User, appName: string, versionName: string, gitRepoPath: string) {
//     throw new Error('Method not implemented.');
//   }

//   validateAppJsonForImport(appJson, appName) {
//     throw new Error('Method not implemented.');
//   }

//   async getAppVersionByVersionId(appGitPushBody: AppGitPushDto): Promise<AppVersion> {
//     throw new Error('Method not implemented.');
//   }

//   async getAppVersionById(versionId: string): Promise<AppVersion> {
//     throw new Error('Method not implemented.');
//   }
// }
