/* eslint-disable no-prototype-builtins */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
//import { AppImportExportService } from '../../services/app_import_export.service';
import {
  catchDbException,
  extractMajorVersion,
  isTooljetVersionWithNormalizedAppDefinitionSchem,
} from 'src/helpers/utils.helper';
import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@modules/app-git/dto';
import { User } from 'src/entities/user.entity';
import * as path from 'path';
import * as fs from 'fs';
import { App } from 'src/entities/app.entity';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
//import { ImportExportResourcesService } from '../../services/import_export_resources.service';
import { ImportAppDto, ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { TooljetDbImportExportService } from '@modules/tooljet-db/services/tooljet-db-import-export.service';
import { AppGitUtilService } from './util.service';
//import { GitSyncUtilService } from '@modules/git-sync/util.service';
import { AppsRepository } from '@modules/apps/repository';
import { VersionRepository } from '@modules/versions/repository';

@Injectable()
export class AppGitService {
  private static PROJECT_ROOT = 'tooljet/gitsync';
  constructor(
    private appVersionsRepository: VersionRepository,
    private appGitUtilService: AppGitUtilService,
    //private gitSyncUtilService: GitSyncUtilService,
    //import-export and tooljetdb are yet to be modularised
    //private appImportExportService: AppImportExportService,
    //private importExportResourcesService: ImportExportResourcesService,
    private tooljetDbImportExportService: TooljetDbImportExportService,

    private readonly _dataSource: DataSource,
    private appsRepository: AppsRepository
  ) {}

  // async checkSyncApp(user: User, versionId: string, organizationId: string) {
  //   const version = await this.appGitUtilService.getAppVersionById(versionId);
  //   const app = version.app;
  //   const projectRoot = AppGitService.PROJECT_ROOT;
  //   const time = new Date();
  //   const initPath = path.join(projectRoot, `${user.id}-${organizationId}-${app.name}-testing-${time.getTime()}`);
  //   const appGit = await this.appGitUtilService.findAppGitByAppId(app.id);
  //   if (appGit) {
  //     if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');
  //     const connection = await this.gitSyncUtilService.testGitConnection(appGit.orgGit, initPath);
  //     const connectionStatus = connection?.connectionStatus;
  //     delete appGit.orgGit.sshPrivateKey;
  //     if (connectionStatus) {
  //       return appGit;
  //     } else return connection;
  //   } else {
  //     const organizationGit = await this.gitSyncUtilService.findOrgGitByOrganizationId(organizationId);
  //     if (organizationGit) {
  //       if (!organizationGit.isEnabled) throw new BadRequestException('Git is not enabled');
  //       const connection = await this.gitSyncUtilService.testGitConnection(organizationGit, initPath);
  //       const connectionStatus = connection?.connectionStatus;
  //       if (connectionStatus) {
  //         const appGitBody = {
  //           gitAppName: app.name,
  //           gitAppId: app.id,
  //           organizationGitId: organizationGit.id,
  //           appId: app.id,
  //         };
  //         const appGit = await this.appGitUtilService.createAppGit(appGitBody);
  //         appGit.orgGit = organizationGit;
  //         delete appGit.orgGit.sshPrivateKey;
  //         return appGit;
  //       } else {
  //         return connection;
  //       }
  //     }
  //   }
  //   throw new NotFoundException('Git Configuration not found');
  // }

  // async syncApp(appGitPushBody: AppGitPushDto, user: User, appGitId: string) {
  //   const branchName = 'master';
  //   const version = await this.appGitUtilService.getAppVersionByVersionId(appGitPushBody);
  //   await this.appGitUtilService.gitPushApp(user, appGitId, branchName, appGitPushBody, version);
  // }

  // async gitPullAppInfo(user: User, appId?: string) {
  //   const organizationId = user.organizationId;
  //   const orgGit = await this.gitSyncUtilService.findOrgGitByOrganizationId(organizationId);
  //   if (!orgGit) throw new NotFoundException('Git Configuration does not exist');
  //   if (!orgGit.isEnabled) throw new BadRequestException('Git Sync is not enabled');
  //   const projectRoot = AppGitService.PROJECT_ROOT;
  //   const time = new Date();
  //   const gitRepoPath = path.join(projectRoot, `${user.id}-${organizationId}-${time.getTime()}`);
  //   let metaData = {};
  //   try {
  //     if (!fs.existsSync(gitRepoPath)) {
  //       fs.mkdirSync(gitRepoPath, { recursive: true });
  //     }

  //     await this.gitSyncUtilService.gitClone(gitRepoPath, orgGit);
  //     const metaFilePath = path.join(gitRepoPath, '.meta', 'meta.json');
  //     if (fs.existsSync(metaFilePath)) {
  //       const appMetaContent = fs.readFileSync(metaFilePath, 'utf8');
  //       metaData = JSON.parse(appMetaContent);
  //       for (const key in metaData) {
  //         if (metaData.hasOwnProperty(key)) {
  //           const value = metaData[key];
  //           const appName = await this.appsRepository.findByAppName(value?.gitAppName, organizationId);
  //           const appNameExist = appName ? 'EXIST' : 'NOT_EXIST';
  //           metaData[key] = { ...value, appNameExist };
  //         }
  //       }
  //       // eslint-disable-next-line no-prototype-builtins
  //       if (appId) {
  //         const appGit = await this.appGitUtilService.findAppGitByAppId(appId);
  //         if (!appGit) throw new BadRequestException('This is not git pulled app');
  //         if (!metaData.hasOwnProperty(appGit.gitAppId))
  //           throw new BadRequestException('App is not present in repo, try to recreate app from git');
  //         metaData = metaData[appGit.gitAppId];
  //       }
  //     }
  //     await this.gitSyncUtilService.deleteDir(gitRepoPath);
  //     delete orgGit.sshPrivateKey;
  //     return { metaData, orgGit };
  //   } catch (err) {
  //     this.gitSyncUtilService.deleteDir(gitRepoPath);
  //     throw BadRequestException;
  //   }
  // }

  // async createGitApp(user: User, appMetaBody: AppGitPullDto) {
  //   const organizationId = user.organizationId;
  //   const orgGit = await this.gitSyncUtilService.findOrgGitByOrganizationId(organizationId);
  //   const projectRoot = AppGitService.PROJECT_ROOT;
  //   const appName = appMetaBody?.gitAppName;
  //   const versionName = appMetaBody?.gitVersionName;
  //   const time = new Date();
  //   const gitRepoPath = path.join(
  //     projectRoot,
  //     `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
  //   );
  //   try {
  //     let app: App;
  //     await this.gitSyncUtilService.gitClone(gitRepoPath, orgGit);

  //     const resourceJson = await this.appGitUtilService.readAppJson(user, appName, versionName, gitRepoPath);
  //     const tjDbList: ImportTooljetDatabaseDto[] = resourceJson?.tooljet_database;
  //     const appList = resourceJson?.app || [];
  //     const tooljet_version = resourceJson?.tooljet_version;
  //     const appListWName: ImportAppDto[] = appList.map((appItem) => {
  //       return { ...appItem, appName: appItem.definition.appV2.name };
  //     });
  //     const importResourceDto: ImportResourcesDto = {
  //       app: appListWName,
  //       tooljet_database: tjDbList,
  //       tooljet_version,
  //       organization_id: organizationId,
  //     };
  //     await catchDbException(async () => {
  //       //const resources = await await this.importExportResourcesService.import(user, importResourceDto, false, true);
  //       //app = resources.app[0];
  //     }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'App name already exists' }]);

  //     app = await this.appsRepository.findById(app.id, organizationId);

  //     const appGitBody = {
  //       gitAppName: appMetaBody.gitAppName,
  //       gitAppId: appMetaBody.gitAppId,
  //       lastCommitUser: appMetaBody.lastCommitUser,
  //       gitVersionName: appMetaBody.gitVersionName,
  //       gitVersionId: appMetaBody.gitVersionId,
  //       organizationGitId: appMetaBody.organizationGitId,
  //       lastCommitMessage: appMetaBody.lastCommitMessage,
  //       appId: app.id,
  //       lastPullDate: new Date(),
  //       lastPushDate: new Date(appMetaBody?.lastPushDate),
  //       versionId: app.editingVersion.id,
  //     };
  //     this.appGitUtilService.createAppGit(appGitBody);
  //     return app;
  //   } catch (error) {
  //     await this.gitSyncUtilService.deleteDir(gitRepoPath);
  //     console.error(error);
  //     throw new BadRequestException(error);
  //   }
  // }

  // async pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string) {
  //   const organizationId = user.organizationId;

  //   const appGit = await this.appGitUtilService.findAppGitByAppId(appId);
  //   const orgGit = appGit.orgGit;
  //   const projectRoot = AppGitService.PROJECT_ROOT;
  //   const appName = appMetaBody?.gitAppName;
  //   const versionName = appMetaBody?.gitVersionName;
  //   const time = new Date();
  //   const gitRepoPath = path.join(
  //     projectRoot,
  //     `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
  //   );
  //   try {
  //     await this.gitSyncUtilService.gitClone(gitRepoPath, orgGit);
  //     const resourceJson = await this.appGitUtilService.readAppJson(user, appName, versionName, gitRepoPath);

  //     const tableNameMapping = {};
  //     const tooljet_database = resourceJson?.toojet_database || [];

  //     if (tooljet_database) {
  //       for (const tjdbImportDto of tooljet_database) {
  //         const createdTable = await this.tooljetDbImportExportService.import(organizationId, tjdbImportDto, true);
  //         tableNameMapping[tjdbImportDto.id] = createdTable;
  //       }
  //     }

  //     const appJson = resourceJson.app[0];
  //     const tooljetVersion = resourceJson?.tooljet_version;

  //     const schemaUnifiedAppParams = this.appGitUtilService.validateAppJsonForImport(appJson?.definition, appName);
  //     const importedAppTooljetVersion = extractMajorVersion(tooljetVersion);
  //     const isNormalizedAppDefinitionSchema =
  //       isTooljetVersionWithNormalizedAppDefinitionSchem(importedAppTooljetVersion);

  //     const app = await this.appsRepository.findById(appId, organizationId);

  //     if (appGit.gitVersionId == appMetaBody.gitVersionId) {
  //       const version = await this.appVersionsRepository.findOne({
  //         where: { id: appGit.versionId },
  //       });

  //       await this.appVersionsRepository.deleteById(version.id);
  //     }

  //     await this.appGitUtilService.UpdateGitApp(schemaUnifiedAppParams, app, user);
  //     // const resourceMapping = await this.appImportExportService.setupImportedAppAssociations(
  //     //   this._dataSource.manager,
  //     //   app,
  //     //   schemaUnifiedAppParams,
  //     //   user,
  //     //   {
  //     //     tooljet_database: tableNameMapping,
  //     //   },
  //     //   isNormalizedAppDefinitionSchema,
  //     //   importedAppTooljetVersion
  //     // );
  //     // await this.appImportExportService.updateEntityReferencesForImportedApp(this._dataSource.manager, resourceMapping);
  //     await app.reload();

  //     const appGitBody = {
  //       gitAppName: appMetaBody?.gitAppName,
  //       lastCommitUser: appMetaBody?.lastCommitUser,
  //       gitVersionName: appMetaBody?.gitVersionName,
  //       gitVersionId: appMetaBody?.gitVersionId,
  //       lastCommitMessage: appMetaBody?.lastCommitMessage,
  //       lastPullDate: new Date(),
  //       lastPushDate: new Date(appMetaBody?.lastPushDate),
  //       versionId: app.editingVersion.id,
  //     };
  //     this.appGitUtilService.updateAppGit(appGit.id, appGitBody);
  //     return app;
  //   } catch (err) {
  //     throw new BadRequestException('Error while pulling changes due to ', err);
  //   }
  // }
}
