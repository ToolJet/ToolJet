import { IGithubHTTPSServiceInterface } from './https-service.interface';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { GITConnectionType, OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { OrganizationGitCreateDto } from '@dto/organization_git.dto';
import { OrganizationGitHTTPSUpdateDto } from '@modules/git-sync/dto';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { AppGitPullDto, AppGitPushDto, AppGitPullUpdateDto } from '@modules/app-git/dto';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { GithubHttpsConfigDTO, ProviderConfigDTO } from '../dto/provider-config.dto';
import { HTTPSGitSyncUtilityService } from './util.service';
import { OrganizationGitHttpsConfigDto } from '../dto/organization-git-provider.dto';
import { AppGitSync } from '@entities/app_git_sync.entity';
import { GitErrorMessages } from '@modules/git-sync/constants/gitsync_error.constant';
import * as fs from 'fs';
import * as path from 'path';
import { ImportAppDto, ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import {
  catchDbException,
  extractMajorVersion,
  isTooljetVersionWithNormalizedAppDefinitionSchem,
} from 'src/helpers/utils.helper';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { RenameAppOrVersionDto } from '../dto/rename-app.dto';
import { decamelizeKeys } from 'humps';
import { OrganizationGitHttps } from '@entities/gitsync_entities/organization_git_https.entity';
import { BaseGitSyncService } from '@modules/git-sync/base-git.service';
import { BaseGitUtilService } from '@modules/git-sync/base-git-util.service';
import { AppsService } from '@modules/apps/service';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { TooljetDbImportExportService } from '@modules/tooljet-db/services/tooljet-db-import-export.service';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
@Injectable()
export class HTTPSGitSyncService extends BaseGitSyncService implements IGithubHTTPSServiceInterface {
  private static PROJECT_ROOT = 'tooljet/gitsync';
  constructor(
    @InjectRepository(AppVersion)
    appVersionsRepository: Repository<AppVersion>,
    @InjectRepository(OrganizationGitSync)
    organizationGitRepository: Repository<OrganizationGitSync>,
    baseGitUtilService: BaseGitUtilService,
    appsService: AppsService,
    importExportResourcesService: ImportExportResourcesService,
    private tooljetDbImportExportService: TooljetDbImportExportService,
    private readonly _dataSource: DataSource,
    private appImportExportService: AppImportExportService,
    private httpsGitSyncUtilityService: HTTPSGitSyncUtilityService,
    protected readonly licenseTermsService: LicenseTermsService
  ) {
    super(
      organizationGitRepository,
      appVersionsRepository,
      importExportResourcesService,
      appsService,
      licenseTermsService,
      baseGitUtilService
    );
  }
  async getProviderConfigs(userOrganizationId: string, organizationId: string): Promise<OrganizationGitHttpsConfigDto> {
    const orgGit = (await this.baseGitUtilService.getOrganizationById(
      userOrganizationId,
      organizationId
    )) as OrganizationGitHttpsConfigDto;
    if (!orgGit) {
      return;
    }
    orgGit.hasProviderConfigs = false;
    const providerConfigs = await this.httpsGitSyncUtilityService.findHttpsConfigs(orgGit.id);
    if (providerConfigs) {
      orgGit.githubAppId = providerConfigs?.githubAppId;
      orgGit.githubEnterpriseUrl = providerConfigs?.githubEnterpriseUrl;
      orgGit.githubEnterpriseApiUrl = providerConfigs?.githubEnterpriseApiUrl;
      orgGit.githubInstallationId = providerConfigs?.githubInstallationId;
      orgGit.gitUrl = providerConfigs?.httpsUrl;
      orgGit.githubBranch = providerConfigs?.githubBranch;
      orgGit.githubPrivateKey = providerConfigs?.githubPrivateKey;
      orgGit.isFinalized = providerConfigs?.isFinalized;
      orgGit.hasProviderConfigs = true;
    }
    return orgGit;
  }
  async checkSyncApp(user: User, version: AppVersion, organizationId: string): Promise<any> {
    const app = version.app;
    const appGit = await this.httpsGitSyncUtilityService.findAppGitByAppIdHTTPS(app.id);
    if (appGit) {
      if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');
      const connection = await this.httpsGitSyncUtilityService.testGitConnection(appGit.orgGit.id);
      const connectionStatus = connection?.connectionStatus;
      // delete appGit.orgGit.sshPrivateKey;
      if (connectionStatus) {
        return appGit;
      } else return connection;
    } else {
      const organizationGit = await this.httpsGitSyncUtilityService.findOrgGitByOrganizationId(organizationId);
      if (organizationGit) {
        if (!organizationGit.isEnabled) throw new BadRequestException('Git is not enabled');
        const connection = await this.httpsGitSyncUtilityService.testGitConnection(organizationGit?.id);
        const connectionStatus = connection?.connectionStatus;
        if (connectionStatus) {
          const appGitBody = {
            gitAppName: app.name,
            gitAppId: app.id,
            organizationGitId: organizationGit.id,
            appId: app.id,
          };
          const appGit = await this.httpsGitSyncUtilityService.createAppGit(appGitBody);
          appGit.orgGit = organizationGit;
          return appGit;
        } else {
          return connection;
        }
      }
    }
    throw new NotFoundException('Git Configuration not found');
  }
  async gitPullAppInfo(user: User, appId?: string) {
    const organizationId = user.organizationId;
    const orgGit = await this.httpsGitSyncUtilityService.findOrgGitByOrganizationId(organizationId);
    if (!orgGit) throw new NotFoundException('Git Configuration does not exist');
    if (!orgGit.isEnabled) throw new BadRequestException('Git Sync is not enabled');
    const projectRoot = HTTPSGitSyncService.PROJECT_ROOT;
    const time = new Date();
    const gitRepoPath = path.join(projectRoot, `${user.id}-${organizationId}-${time.getTime()}`);
    let metaData = {};
    try {
      if (!fs.existsSync(gitRepoPath)) {
        fs.mkdirSync(gitRepoPath, { recursive: true });
      }
      await this.httpsGitSyncUtilityService.gitClone(gitRepoPath, orgGit);
      const metaFilePath = path.join(gitRepoPath, '.meta', 'meta.json');
      if (fs.existsSync(metaFilePath)) {
        const appMetaContent = fs.readFileSync(metaFilePath, 'utf8');
        metaData = JSON.parse(appMetaContent);
        for (const key in metaData) {
          // eslint-disable-next-line no-prototype-builtins
          if (metaData.hasOwnProperty(key)) {
            const value = metaData[key];
            const appName = await this.appsService.findByAppName(value?.gitAppName, organizationId);
            const appNameExist = appName ? 'EXIST' : 'NOT_EXIST';
            metaData[key] = { ...value, appNameExist };
          }
        }
        if (appId) {
          const appGit = await this.httpsGitSyncUtilityService.findAppGitByAppId(appId);
          if (!appGit) throw new BadRequestException('This is not git pulled app');
          // eslint-disable-next-line no-prototype-builtins
          if (!metaData.hasOwnProperty(appGit.gitAppId))
            throw new BadRequestException('App is not present in repo, try to recreate app from git');
          metaData = metaData[appGit.gitAppId];
        }
      }
      await this.httpsGitSyncUtilityService.deleteDir(gitRepoPath);
      // delete orgGit.sshPrivateKey;
      return { metaData, orgGit };
    } catch (err) {
      this.httpsGitSyncUtilityService.deleteDir(gitRepoPath);
      if (err.message.includes('reference') && err.message.includes('not found')) {
        throw new BadRequestException(GitErrorMessages.BRANCH_NOT_FOUND);
      }
      throw BadRequestException;
    }
  }
  async createGitApp(user: User, appMetaBody: AppGitPullDto) {
    const organizationId = user.organizationId;
    const orgGit = await this.httpsGitSyncUtilityService.findOrgGitByOrganizationId(organizationId);
    const projectRoot = HTTPSGitSyncService.PROJECT_ROOT;
    const appName = appMetaBody?.gitAppName;
    const versionName = appMetaBody?.gitVersionName;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
    );
    try {
      let app: App;
      await this.httpsGitSyncUtilityService.gitClone(gitRepoPath, orgGit);

      const resourceJson = await this.httpsGitSyncUtilityService.readAppJson(user, appName, versionName, gitRepoPath);
      const tjDbList: ImportTooljetDatabaseDto[] = resourceJson?.tooljet_database;
      const appList = resourceJson?.app || [];
      const tooljet_version = resourceJson?.tooljet_version;
      const appListWName: ImportAppDto[] = appList.map((appItem) => {
        return { ...appItem, appName: appItem.definition.appV2.name };
      });
      const importResourceDto: ImportResourcesDto = {
        app: appListWName,
        tooljet_database: tjDbList,
        tooljet_version,
        organization_id: organizationId,
      };
      await catchDbException(async () => {
        const resources = await await this.importExportResourcesService.import(user, importResourceDto, false, true);
        app = resources.app[0];
      }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'App name already exists' }]);

      app = await this.appsService.find(app.id);

      const appGitBody = {
        gitAppName: appMetaBody.gitAppName,
        gitAppId: appMetaBody.gitAppId,
        lastCommitUser: appMetaBody.lastCommitUser,
        gitVersionName: appMetaBody.gitVersionName,
        gitVersionId: appMetaBody.gitVersionId,
        organizationGitId: appMetaBody.organizationGitId,
        lastCommitMessage: appMetaBody.lastCommitMessage,
        appId: app.id,
        lastPullDate: new Date(),
        lastPushDate: new Date(appMetaBody?.lastPushDate),
        versionId: app.editingVersion.id,
      };
      this.httpsGitSyncUtilityService.createAppGit(appGitBody);
      return app;
    } catch (error) {
      await this.httpsGitSyncUtilityService.deleteDir(gitRepoPath);
      console.error(error);
      throw new BadRequestException(error);
    }
  }

  async gitPushApp(
    user: User,
    appGitId: string,
    appGitPushBody: AppGitPushDto,
    version: AppVersion,
    remoteName = 'origin'
  ): Promise<void> {
    const appGit = await this.httpsGitSyncUtilityService.findAppGitById(appGitId);
    if (!appGit) throw new BadRequestException('Need to set up app git info before pushing the app');
    if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');
    const app = version.app;
    const projectRoot = HTTPSGitSyncService.PROJECT_ROOT;
    const organizationGit = appGit.orgGit;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationGit.organizationId}-${app.name}-pushing-${time.getTime()}`
    );
    try {
      const repo = await this.httpsGitSyncUtilityService.gitClone(gitRepoPath, organizationGit);
      const clonedRepositoryPath = repo.path;
      await this.httpsGitSyncUtilityService.WriteAppFile(user, clonedRepositoryPath, appGit, version, app);
      await this.httpsGitSyncUtilityService.writeMetaFile(user, clonedRepositoryPath, appGit, appGitPushBody);
      await this.httpsGitSyncUtilityService.gitCommit(
        clonedRepositoryPath,
        appGitPushBody.lastCommitMessage,
        appGit,
        user
      );
      // Push the commits to remote
      await this.httpsGitSyncUtilityService
        .gitPush(clonedRepositoryPath, organizationGit, remoteName)
        .then(async () => {
          await this.httpsGitSyncUtilityService.deleteDir(gitRepoPath);
          appGit.lastPushDate = new Date();
          await dbTransactionWrap(async (manager: EntityManager) => {
            return await manager.save(AppGitSync, appGit);
          });
        })
        .catch((err) => {
          console.error(err);
          this.httpsGitSyncUtilityService.deleteDir(gitRepoPath);
          throw new BadRequestException(err);
        });
    } catch (error) {
      // Pushed for testing render commits failing
      if (error?.message.includes('commit failed')) {
        throw new BadRequestException(GitErrorMessages.COMMIT_FAILED);
      } else if (error?.message.includes('clone failed')) {
        throw new BadRequestException(GitErrorMessages.CLONE_FAILED);
      }
      throw new BadRequestException(GitErrorMessages.PUSH_FAILED);
      // Need to do all the error handling here
    }
  }
  async renameAppOrVersion(user: User, appId: string, renameAppOrVersionDto: RenameAppOrVersionDto): Promise<any> {
    const appGit = await this.httpsGitSyncUtilityService.findAppGitByAppId(appId);
    const { prevName, updatedName, renameVersionFlag, remoteName } = renameAppOrVersionDto;
    if (!appGit) return;
    if (appGit.orgGit.isEnabled == false) return;
    const version = await this.appVersionsRepository.findOne({
      where: { id: appGit.versionId },
      relations: ['app'],
    });
    if (!version) return;
    const commitMessage = `${
      renameVersionFlag ? `Version ${prevName}` : `App ${prevName}`
    } is renamed to ${updatedName}`;
    const appGitPushBody: AppGitPushDto = {
      gitAppName: appGit.gitAppName,
      lastCommitMessage: commitMessage,
      versionId: appGit.gitVersionId,
      gitVersionName: appGit.gitVersionName,
    };
    return this.gitPushApp(user, appGit.id, appGitPushBody, version, remoteName);
  }
  async pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string): Promise<App> {
    const organizationId = user.organizationId;

    const appGit = await this.httpsGitSyncUtilityService.findAppGitByAppId(appId);
    const orgGit = appGit.orgGit;
    const projectRoot = HTTPSGitSyncService.PROJECT_ROOT;
    const appName = appMetaBody?.gitAppName;
    const versionName = appMetaBody?.gitVersionName;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
    );
    try {
      await this.httpsGitSyncUtilityService.gitClone(gitRepoPath, orgGit);
      const resourceJson = await this.httpsGitSyncUtilityService.readAppJson(user, appName, versionName, gitRepoPath);

      const tableNameMapping = {};
      const tooljet_database = resourceJson?.toojet_database || [];

      if (tooljet_database) {
        for (const tjdbImportDto of tooljet_database) {
          const createdTable = await this.tooljetDbImportExportService.import(organizationId, tjdbImportDto, true);
          tableNameMapping[tjdbImportDto.id] = createdTable;
        }
      }

      const appJson = resourceJson.app[0];
      const tooljetVersion = resourceJson?.tooljet_version;

      const schemaUnifiedAppParams = this.httpsGitSyncUtilityService.validateAppJsonForImport(
        appJson?.definition,
        appName
      );
      const importedAppTooljetVersion = extractMajorVersion(tooljetVersion);
      const isNormalizedAppDefinitionSchema =
        isTooljetVersionWithNormalizedAppDefinitionSchem(importedAppTooljetVersion);

      const app = await this.appsService.find(appId);

      if (appGit.gitVersionId == appMetaBody.gitVersionId) {
        const version = await this.appVersionsRepository.findOne({
          where: { id: appGit.versionId },
        });

        await this.appsService.deleteVersion(app, version);
      }

      await this.httpsGitSyncUtilityService.UpdateGitApp(schemaUnifiedAppParams, app);
      const resourceMapping = await this.appImportExportService.setupImportedAppAssociations(
        this._dataSource.manager,
        app,
        schemaUnifiedAppParams,
        user,
        {
          tooljet_database: tableNameMapping,
        },
        isNormalizedAppDefinitionSchema,
        importedAppTooljetVersion
      );
      await this.appImportExportService.updateEntityReferencesForImportedApp(this._dataSource.manager, resourceMapping);

      await app.reload();

      const appGitBody = {
        gitAppName: appMetaBody?.gitAppName,
        lastCommitUser: appMetaBody?.lastCommitUser,
        gitVersionName: appMetaBody?.gitVersionName,
        gitVersionId: appMetaBody?.gitVersionId,
        lastCommitMessage: appMetaBody?.lastCommitMessage,
        lastPullDate: new Date(),
        lastPushDate: new Date(appMetaBody?.lastPushDate),
        versionId: app.editingVersion.id,
      };
      this.httpsGitSyncUtilityService.updateAppGit(appGit.id, appGitBody);
      return app;
    } catch (err) {
      throw new BadRequestException('Error while pulling changes due to ', err);
    }
  }
  async setFinalizeConfig(
    userId: string,
    organizationId: string,
    organizationGitId: string,
    manager?: EntityManager
  ): Promise<OrganizationGitSync> {
    // First we find the entry in the organization git table using the organization git id
    const repository = manager ? manager.getRepository(OrganizationGitSync) : this.organizationGitRepository;
    const orgGit = await repository.findOne({
      where: {
        id: organizationGitId,
        organizationId,
      },
    });
    if (!orgGit) throw new BadRequestException('Wrong organization git Id');
    const connection = await this.httpsGitSyncUtilityService.testGitConnection(orgGit.id, manager);
    const httpsConfigs = await this.httpsGitSyncUtilityService.findHttpsConfigs(orgGit?.id, manager);
    httpsConfigs.isFinalized = true;
    const connectionStatus = connection.connectionStatus;
    if (!connectionStatus) {
      throw new BadRequestException(connection.connectionMessage);
    }
    orgGit.gitType = GITConnectionType.GITHUB_HTTPS;
    orgGit.isEnabled = true;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.save(httpsConfigs);
      return await manager.save(orgGit);
    }, manager);
  }
  async saveProviderConfig(userId: string, organizationId: string, configData: ProviderConfigDTO): Promise<void> {
    const orgGit = await this.httpsGitSyncUtilityService.findOrgGitByOrganizationId(organizationId);
    return dbTransactionWrap(async (manager: EntityManager) => {
      let organizationGitSyncId;
      if (!orgGit) {
        // create a new git organization from the config data received and store it in the organization_git_sync table
        const organizationCreateDto: OrganizationGitCreateDto = {
          gitType: 'github_https',
          gitUrl: configData.gitUrl,
          organizationId: organizationId,
        };
        const createdOrgGit = await this.createOrganizationGit(organizationCreateDto, manager);
        organizationGitSyncId = createdOrgGit.id;
      } else {
        organizationGitSyncId = orgGit.id;
      }
      await this.httpsGitSyncUtilityService.createGitHttpsConfig(
        configData as GithubHttpsConfigDTO,
        organizationGitSyncId,
        manager
      );
      await this.setFinalizeConfig(userId, organizationId, organizationGitSyncId, manager);
      return;
    });
  }
  async createOrganizationGit(
    organizationGitCreateDto: OrganizationGitCreateDto,
    manager?: EntityManager
  ): Promise<OrganizationGitSync> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const orgGit = await manager.create(OrganizationGitSync, organizationGitCreateDto);
      const result = await manager.save(orgGit);
      return result;
    }, manager);
  }
  async getOrgGitStatusById(userOrganizationId: string, organizationId: string) {
    if (organizationId !== userOrganizationId) {
      throw new BadRequestException();
    }
    const organizationGit = await this.baseGitUtilService.findOrgGitByOrganizationId(organizationId);
    if (!organizationGit) {
      return;
    }
    if (!(await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.GIT_SYNC))) {
      organizationGit.isEnabled = false;
    }
    const providerConfigs = await this.httpsGitSyncUtilityService.findHttpsConfigs(organizationGit?.id);
    return decamelizeKeys({
      isEnabled: organizationGit.isEnabled,
      isFinalized: providerConfigs.isFinalized,
      id: organizationGit.id,
    });
  }
  async updateOrgGit(
    organizationId: string,
    id: string,
    updateOrgGitHTTPSDto: OrganizationGitHTTPSUpdateDto
  ): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.update(
        OrganizationGitSync,
        { organizationId, id }, // This is the criteria/where clause directly
        updateOrgGitHTTPSDto
      );
    });
  }

  async deleteConfig(organizationId: string, organizationGitId: string): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(OrganizationGitHttps, {
        where: { configId: organizationGitId },
      });
      await manager.delete(OrganizationGitHttps, { configId: organizationGitId });
      // After deleting the configs : we are disabling the enabled status and updating auto commit to false
      await this.httpsGitSyncUtilityService.updateGitSyncSettings(organizationId, organizationGitId, false, false);
    });
  }
}
// For HTTPS flow the organization is not created by default ->
// SO while doing save changes -> in the backend we will add a check if the organization is not already created we will create new organization git table entry
