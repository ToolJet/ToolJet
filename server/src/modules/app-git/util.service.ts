/* eslint-disable no-prototype-builtins */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
// import {
//   convertSinglePageSchemaToMultiPageSchema,
// } from '../../services/app_import_export.service';
import { AppsService } from '@modules/apps/service';
import { catchDbException, extractWorkFromUrl } from 'src/helpers/utils.helper';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';
import * as path from 'path';
import * as NodeGit from '@figma/nodegit';
import * as fs from 'fs';
import { AppVersion } from 'src/entities/app_version.entity';
import { App } from 'src/entities/app.entity';
import { AppUpdateDto } from '@modules/apps/dto';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { ExportAppDto, ExportResourcesDto, ExportTooljetDatabaseDto } from '@dto/export-resources.dto';
//import { ImportExportResourcesService } from '../../services/import_export_resources.service';
//import { TooljetDbImportExportService } from '../../services/tooljet_db_import_export_service';
//import { GitSyncUtilService } from '@modules/git-sync/util.service';
import { VersionService } from '@modules/versions/service';
import { VersionRepository } from '@modules/versions/repository';

@Injectable()
export class AppGitUtilService {
  private static PROJECT_ROOT = 'tooljet/gitsync';
  constructor(
    @InjectRepository(AppGitSync)
    private appGitRepository: Repository<AppGitSync>,
    private appVersionsRepository: VersionRepository,
    //private importExportResourcesService: ImportExportResourcesService,
    private appsService: AppsService,
    //private gitSyncUTilService: GitSyncUtilService,
    private versionService: VersionService
  ) {}

  async findAppGitById(appGitId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { id: appGitId },
      relations: ['orgGit'],
    });
  }

  async findAppGitByAppId(appId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { appId: appId },
      relations: ['orgGit'],
    });
  }

  async createAppGit(CreateBody: any): Promise<AppGitSync> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appGit = manager.create(AppGitSync, CreateBody);
      return await manager.save(appGit);
    });
  }

  async updateAppGit(appGitId: string, UpdateBody: any) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.update(AppGitSync, appGitId, UpdateBody);
    });
  }

  // async gitPushApp(
  //   user: User,
  //   appGitId: string,
  //   branchName: string,
  //   appGitPushBody: AppGitPushDto,
  //   version: AppVersion,
  //   remoteName = 'origin'
  // ) {
  //   const appGit = await this.findAppGitById(appGitId);
  //   if (!appGit) throw new BadRequestException('Need to set up app git info before pushing the app');
  //   if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');

  //   const app = version.app;

  //   const projectRoot = AppGitUtilService.PROJECT_ROOT;
  //   const organizationGit = appGit.orgGit;
  //   const time = new Date();
  //   const gitRepoPath = path.join(
  //     projectRoot,
  //     `${user.id}-${organizationGit.organizationId}-${app.name}-pushing-${time.getTime()}`
  //   );
  //   if (!fs.existsSync(gitRepoPath)) {
  //     fs.mkdirSync(gitRepoPath, { recursive: true });
  //   }
  //   try {
  //     const repo = await this.gitSyncUTilService.gitClone(gitRepoPath, organizationGit);
  //     const repoPath = path.dirname(repo.path());

  //     await this.WriteAppFile(user, repoPath, appGit, version, app);
  //     await this.writeMetaFile(user, repoPath, appGit, appGitPushBody);
  //     await this.gitCommit(repo, appGitPushBody.lastCommitMessage, user, appGit);
  //     await this.pushRepo(repo, appGit, branchName, remoteName)
  //       .then(async () => {
  //         await this.gitSyncUTilService.deleteDir(gitRepoPath);
  //         appGit.lastPushDate = new Date();
  //         await dbTransactionWrap(async (manager: EntityManager) => {
  //           return await manager.save(AppGitSync, appGit);
  //         });
  //       })
  //       .catch((err) => {
  //         console.error(err);
  //         this.gitSyncUTilService.deleteDir(gitRepoPath);
  //       });
  //   } catch (err) {
  //     throw new BadRequestException('Issue while cloning');
  //   }
  // }

  private async WriteAppFile(user: User, repoPath: string, appGit: AppGitSync, version: AppVersion, app: App) {
    // const tables: ExportTooljetDatabaseDto[] = await this.appsService.findTooljetDbTables(app.id);
    // const appList: ExportAppDto[] = [{ id: app.id, search_params: { version_id: version.id } }];
    // const exportDto: ExportResourcesDto = {
    //   app: appList,
    //   tooljet_database: tables,
    //   organization_id: app.organizationId,
    // };
    // const result = await this.importExportResourcesService.export(user, exportDto);
    // const resourceObject = { ...result, tooljet_version: globalThis.TOOLJET_VERSION };
    // const appJson = JSON.stringify(resourceObject, null, 2);
    // let appPath = path.join(repoPath, appGit.gitAppName);
    // if (app.name != appGit.gitAppName) {
    //   const newPath = path.join(repoPath, app.name);
    //   if (fs.existsSync(appPath)) {
    //     fs.rename(appPath, newPath, (err) => {
    //       if (err) {
    //         console.error('Issue while renaming', err);
    //         this.gitSyncUTilService.deleteDir(repoPath);
    //         throw new BadRequestException('Error while writting JSON file');
    //       }
    //     });
    //   }
    //   appPath = newPath;
    //   appGit.gitAppName = app.name;
    // }
    // if (!fs.existsSync(appPath)) {
    //   fs.mkdirSync(appPath, { recursive: true });
    // }
    // let filePath = path.join(appPath, `${appGit.gitVersionName}.json`);
    // if (appGit.versionId != null && (appGit.gitVersionId != version.id || appGit.gitVersionName != version.name)) {
    //   if (fs.existsSync(filePath)) {
    //     fs.unlink(filePath, (err) => {
    //       if (err) {
    //         this.gitSyncUTilService.deleteDir(repoPath);
    //         throw new BadRequestException('Error while renaming app version');
    //       }
    //     });
    //   }
    // }
    // appGit.gitVersionName = version.name;
    // appGit.gitVersionId = version.id;
    // appGit.versionId = version.id;
    // filePath = path.join(appPath, `${appGit.gitVersionName}.json`);
    // try {
    //   await fs.promises.writeFile(filePath, appJson);
    //   return `${appGit.gitAppName}/${appGit.gitVersionName}.json`;
    // } catch (err) {
    //   this.gitSyncUTilService.deleteDir(repoPath);
    //   throw new BadRequestException(`Error writing file "${filePath}": ${err}`);
    // }
  }

  // Create a listener for this. If called from app service async
  // async renameAppOrVersion(
  //   user: User,
  //   appId: string,
  //   prevName = '',
  //   renameVersionFlag = false,
  //   branchName = 'master',
  //   remoteName = 'origin'
  // ) {
  //   const appGit = await this.findAppGitByAppId(appId);
  //   if (!appGit) return;
  //   if (appGit.orgGit.isEnabled == false) return;
  //   const version = await this.appVersionsRepository.findOne({
  //     where: { id: appGit.versionId },
  //     relations: ['app'],
  //   });
  //   if (!version) return;

  //   const appGitPushBody: AppGitPushDto = {
  //     gitAppName: appGit.gitAppName,
  //     lastCommitMessage: `${
  //       renameVersionFlag ? `Version ${prevName} of app ${appGit.gitAppName} ` : `App ${prevName}`
  //     }  is renamed to ${renameVersionFlag ? appGit.gitVersionName : appGit.gitAppName}`,
  //     versionId: appGit.gitVersionId,
  //     gitVersionName: appGit.gitVersionName,
  //   };
  //   // This one to be moved to gitsync service,
  //   // Should pass appGit instead of appGit.id
  //   return this.gitPushApp(user, appGit.id, branchName, appGitPushBody, version, remoteName);
  // }

  private async pushRepo(repo: NodeGit.Repository, appGit: AppGitSync, branchName: string, remoteName: string) {
    const orgGit = appGit.orgGit;
    const gitUser = extractWorkFromUrl(orgGit.gitUrl);
    const credentials: NodeGit.Credential = NodeGit.Credential.sshKeyMemoryNew(
      gitUser,
      orgGit.sshPublicKey,
      orgGit.sshPrivateKey,
      ''
    );
    const remote = await repo.getRemote(remoteName);
    return remote.push([`refs/heads/${branchName}:refs/heads/${branchName}`], {
      callbacks: {
        credentials: () => credentials,
      },
    });
  }

  //Need to work more on this
  private async gitCommit(repo: NodeGit.Repository, commitMessage: string, commitingUser: User, appGit: AppGitSync) {
    const index = await repo.refreshIndex();
    // index.addByPath(fileName);
    await index.addAll();
    await index.write();
    const oid = await index.writeTree();
    await NodeGit.Tree.lookup(repo, oid);
    const author = NodeGit.Signature.now(
      `${commitingUser.firstName ? commitingUser.firstName : ''} ${
        commitingUser.lastName ? commitingUser.lastName : ''
      }`,
      `${commitingUser.email}`
    );
    const committer = NodeGit.Signature.now(
      `${commitingUser.firstName ? commitingUser.firstName : ''} ${
        commitingUser.lastName ? commitingUser.lastName : ''
      }`,
      `${commitingUser.email}`
    );
    const commitMessageWithDesc = `Version ${appGit.gitVersionName} of ${appGit.gitAppName}: ${commitMessage}`;
    try {
      const head = await NodeGit.Reference.nameToId(repo, 'HEAD');
      const parent = await repo.getCommit(head);
      await repo.createCommit('HEAD', author, committer, commitMessageWithDesc, oid, [parent]).then((commitId) => {
        appGit.lastCommitId = commitId.tostrS();
        appGit.lastCommitMessage = commitMessage;

        appGit.lastCommitUser = `${commitingUser.firstName ? commitingUser.firstName : ''} ${
          commitingUser.lastName ? commitingUser.lastName : ''
        }`;
      });
    } catch (err) {
      await repo
        .createCommit('HEAD', author, committer, commitMessage, oid, [])
        .then((commitId) => {
          appGit.lastCommitId = commitId.toString();
          appGit.lastCommitMessage = commitMessage;
          appGit.lastCommitUser = `${commitingUser.firstName ? commitingUser.firstName : ''} ${
            commitingUser.lastName ? commitingUser.lastName : ''
          }`;
        })
        .catch((err) => {
          console.error('Not able to commit due to ', err);
        });
    }
  }

  // private async writeMetaFile(user: User, repoPath: string, appGit: AppGitSync, appGitPushBody: AppGitPushDto) {
  //   const metaDr = path.join(repoPath, '.meta');
  //   const metaFile = path.join(metaDr, 'meta.json');
  //   let appMeta = {};
  //   if (!fs.existsSync(metaDr)) {
  //     fs.mkdirSync(metaDr, { recursive: true });
  //   } else {
  //     const appMetaContent = fs.readFileSync(metaFile, 'utf8');
  //     appMeta = JSON.parse(appMetaContent);
  //   }
  //   appMeta[appGit.gitAppId] = {
  //     gitAppName: appGit.gitAppName,
  //     lastCommitMessage: appGitPushBody.lastCommitMessage,
  //     gitVersionId: appGit.gitVersionId,
  //     lastpushDate: new Date(),
  //     gitVersionName: appGit.gitVersionName,
  //     lastCommitUser: `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`,
  //   };
  //   const appMetaString = JSON.stringify(appMeta, null, 2);
  //   try {
  //     await fs.promises.writeFile(metaFile, appMetaString);
  //     return `${appGit.gitAppName}/${appGit.gitVersionName}.json`;
  //   } catch (err) {
  //     this.gitSyncUTilService.deleteDir(repoPath);
  //     throw new Error(`Error writing file "${metaFile}": ${err}`);
  //   }
  // }

  async UpdateGitApp(schemaUnifiedAppParam: any, app: App, user: User) {
    const appUpdateBody: AppUpdateDto = {
      name: schemaUnifiedAppParam.name,
      slug: undefined, // Prevent db unique constraint error.
      icon: schemaUnifiedAppParam?.icon,
      current_version_id: undefined,
      is_public: app.isPublic,
      is_maintenance_on: app.isMaintenanceOn,
    };
    app.name = schemaUnifiedAppParam.name;
    app.slug = schemaUnifiedAppParam?.slug;
    app.icon = schemaUnifiedAppParam?.icon;
    return await catchDbException(async () => {
      return await this.appsService.update(app, appUpdateBody, user);
    }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'App name already exists' }]);
  }

  // async readAppJson(user: User, appName: string, versionName: string, gitRepoPath: string) {
  //   const appFilePath = path.join(gitRepoPath, appName, `${versionName}.json`);
  //   try {
  //     const appContent = fs.readFileSync(appFilePath, 'utf8');
  //     this.gitSyncUTilService.deleteDir(gitRepoPath);
  //     const appJson = JSON.parse(appContent);
  //     return appJson;
  //   } catch (err) {
  //     this.gitSyncUTilService.deleteDir(gitRepoPath);
  //     throw new BadRequestException('Error while reading git file');
  //   }
  // }

  validateAppJsonForImport(appJson, appName) {
    let appParams = appJson;
    if (appParams?.appV2) {
      appParams = { ...appParams.appV2 };
    }

    if (!appParams?.name) {
      throw new BadRequestException('Invalid params for app import');
    }

    // const schemaUnifiedAppParams = appParams?.schemaDetails?.multiPages
    //   ? appParams
    //   : convertSinglePageSchemaToMultiPageSchema(appParams);
    // schemaUnifiedAppParams.name = appName;
    //return schemaUnifiedAppParams;
    return {};
  }

  private async deleteAppVersions(appVersions: AppVersion[], app: App, user: User) {
    for (const version of appVersions) this.versionService.deleteVersion(app, user);
  }

  async getAppVersionByVersionId(appGitPushBody: AppGitPushDto) {
    let versionId = appGitPushBody.versionId;
    let version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });

    versionId = versionId == version.app.editingVersion.id ? versionId : version.app.editingVersion.id;
    version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');
    return version;
  }

  async getAppVersionById(versionId: string) {
    const version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');
    return version;
  }
}
