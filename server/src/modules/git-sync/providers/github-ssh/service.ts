import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto } from '@dto/organization_git.dto';
import { GITConnectionType, OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { User } from 'src/entities/user.entity';
import * as path from 'path';
import * as fs from 'fs';
import { AppVersion } from 'src/entities/app_version.entity';
import { SSHGitSyncUtilityService } from './util.service';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GitErrorMessages } from '@modules/git-sync/constants/gitsync_error.constant';
import { AppGitPushDto, AppGitPullDto, AppGitPullUpdateDto } from '@modules/app-git/dto';
import { App } from 'src/entities/app.entity';
import { ImportAppDto, ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import {
  catchDbException,
  extractMajorVersion,
  isTooljetVersionWithNormalizedAppDefinitionSchem,
} from 'src/helpers/utils.helper';
import { IGithubSSHServiceInterface } from './ssh-service.interface';
import { OrganizationGitSsh } from '@entities/gitsync_entities/organization_git_ssh.entity';
import { ProviderConfigDTO } from '../dto/provider-config.dto';
// import { decamelizeKeys } from 'humps';
import { OrganizationGitSshConfigDto } from '../dto/organization-git-provider.dto';
import { RenameAppOrVersionDto } from '../dto/rename-app.dto';
import { decamelizeKeys } from 'humps';
import { BaseGitSyncService } from '@modules/git-sync/base-git.service';
import { BaseGitUtilService } from '@modules/git-sync/base-git-util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { AppsService } from '@modules/apps/service';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { TooljetDbImportExportService } from '@modules/tooljet-db/services/tooljet-db-import-export.service';
import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
@Injectable()
export class SSHGitSyncService extends BaseGitSyncService implements IGithubSSHServiceInterface {
  private static PROJECT_ROOT = 'tooljet/gitsync';
  constructor(
    @InjectRepository(AppVersion)
    appVersionsRepository: Repository<AppVersion>,
    @InjectRepository(OrganizationGitSync)
    organizationGitRepository: Repository<OrganizationGitSync>,
    licenseTermsService: LicenseTermsService,
    baseGitUtilService: BaseGitUtilService,
    appsService: AppsService,
    importExportResourcesService: ImportExportResourcesService,
    private tooljetDbImportExportService: TooljetDbImportExportService,
    private readonly _dataSource: DataSource,
    private appImportExportService: AppImportExportService,
    private sshGitSyncUtilityService: SSHGitSyncUtilityService
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
  async checkSyncApp(user: User, version: AppVersion, organizationId: string) {
    const app = version.app;
    const projectRoot = SSHGitSyncService.PROJECT_ROOT;
    const time = new Date();
    const initPath = path.join(projectRoot, `${user.id}-${organizationId}-${app.name}-testing-${time.getTime()}`);
    const appGit = await this.sshGitSyncUtilityService.findAppGitByAppIdSSH(app.id);
    if (appGit) {
      if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');
      const connection = await this.sshGitSyncUtilityService.testGitConnection(appGit.orgGit, initPath);
      const connectionStatus = connection?.connectionStatus;
      if (connectionStatus) {
        return appGit;
      } else return connection;
    } else {
      const organizationGit = await this.sshGitSyncUtilityService.findOrgGitByOrganizationId(organizationId);
      if (organizationGit) {
        if (!organizationGit.isEnabled) throw new BadRequestException('Git is not enabled');
        const connection = await this.sshGitSyncUtilityService.testGitConnection(organizationGit, initPath);
        const connectionStatus = connection?.connectionStatus;
        if (connectionStatus) {
          const appGitBody = {
            gitAppName: app.name,
            gitAppId: app.id,
            organizationGitId: organizationGit.id,
            appId: app.id,
          };
          const appGit = await this.sshGitSyncUtilityService.createAppGit(appGitBody);
          appGit.orgGit = organizationGit;
          // delete appGit.orgGit.sshPrivateKey;
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
    const orgGit = await this.sshGitSyncUtilityService.findOrgGitByOrganizationId(organizationId);
    if (!orgGit) throw new NotFoundException('Git Configuration does not exist');
    if (!orgGit.isEnabled) throw new BadRequestException('Git Sync is not enabled');
    const projectRoot = SSHGitSyncService.PROJECT_ROOT;
    const time = new Date();
    const gitRepoPath = path.join(projectRoot, `${user.id}-${organizationId}-${time.getTime()}`);
    let metaData = {};
    try {
      if (!fs.existsSync(gitRepoPath)) {
        fs.mkdirSync(gitRepoPath, { recursive: true });
      }

      await this.sshGitSyncUtilityService.gitClone(gitRepoPath, orgGit);
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
          const appGit = await this.sshGitSyncUtilityService.findAppGitByAppId(appId);
          if (!appGit) throw new BadRequestException('This is not git pulled app');
          // eslint-disable-next-line no-prototype-builtins
          if (!metaData.hasOwnProperty(appGit.gitAppId))
            throw new BadRequestException('App is not present in repo, try to recreate app from git');
          metaData = metaData[appGit.gitAppId];
        }
      }
      await this.sshGitSyncUtilityService.deleteDir(gitRepoPath);
      // delete orgGit.sshPrivateKey;
      return { metaData, orgGit };
    } catch (err) {
      this.sshGitSyncUtilityService.deleteDir(gitRepoPath);
      if (err.message.includes('reference') && err.message.includes('not found')) {
        throw new BadRequestException(GitErrorMessages.BRANCH_NOT_FOUND);
      }
      throw BadRequestException;
    }
  }
  async createGitApp(user: User, appMetaBody: AppGitPullDto) {
    const organizationId = user.organizationId;
    const orgGit = await this.sshGitSyncUtilityService.findOrgGitByOrganizationId(organizationId);
    const projectRoot = SSHGitSyncService.PROJECT_ROOT;
    const appName = appMetaBody?.gitAppName;
    const versionName = appMetaBody?.gitVersionName;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
    );
    try {
      let app: App;
      await this.sshGitSyncUtilityService.gitClone(gitRepoPath, orgGit);

      const resourceJson = await this.sshGitSyncUtilityService.readAppJson(user, appName, versionName, gitRepoPath);
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
      this.sshGitSyncUtilityService.createAppGit(appGitBody);
      return app;
    } catch (error) {
      await this.sshGitSyncUtilityService.deleteDir(gitRepoPath);
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
  ) {
    // For ssh currently master is the default branch and custom branch can be configured from the .env variable
    // TO DO -> Move the branch configuration to UI and read the branch name from db
    const branchName = process.env.GITSYNC_TARGET_BRANCH || 'master';
    const appGit = await this.sshGitSyncUtilityService.findAppGitById(appGitId);
    if (!appGit) throw new BadRequestException('Need to set up app git info before pushing the app');
    if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');

    const app = version.app;

    const projectRoot = SSHGitSyncService.PROJECT_ROOT;
    const organizationGit = appGit.orgGit;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationGit.organizationId}-${app.name}-pushing-${time.getTime()}`
    );
    if (!fs.existsSync(gitRepoPath)) {
      fs.mkdirSync(gitRepoPath, { recursive: true });
    }
    try {
      const repo = await this.sshGitSyncUtilityService.gitClone(gitRepoPath, organizationGit);
      const repoPath = path.dirname(repo.path());

      await this.sshGitSyncUtilityService.WriteAppFile(user, repoPath, appGit, version, app);
      await this.sshGitSyncUtilityService.writeMetaFile(user, repoPath, appGit, appGitPushBody);
      await this.sshGitSyncUtilityService.gitCommit(repo, appGitPushBody.lastCommitMessage, user, appGit);
      await this.sshGitSyncUtilityService
        .pushRepo(repo, appGit, branchName, remoteName)
        .then(async () => {
          await this.sshGitSyncUtilityService.deleteDir(gitRepoPath);
          appGit.lastPushDate = new Date();
          await dbTransactionWrap(async (manager: EntityManager) => {
            return await manager.save(AppGitSync, appGit);
          });
        })
        .catch((err) => {
          console.error(err);
          this.sshGitSyncUtilityService.deleteDir(gitRepoPath);
          throw new BadRequestException(err);
        });
    } catch (err) {
      if (err.message.includes('reference') && err.message.includes('not found')) {
        throw new BadRequestException(GitErrorMessages.BRANCH_NOT_FOUND);
      }
      if (err.message?.includes('does not match any')) {
        throw new BadRequestException(GitErrorMessages.BRANCH_NAME_MISMATCH);
      }
      throw new BadRequestException(GitErrorMessages.GENERIC_CLONE_ERROR);
    }
  }
  async renameAppOrVersion(user: User, appId: string, renameAppOrVersionDto: RenameAppOrVersionDto) {
    // If branch name is not provided in the env file than we will be using default branch name - 'master'
    const { prevName, updatedName, renameVersionFlag, remoteName } = renameAppOrVersionDto;
    const appGit = await this.sshGitSyncUtilityService.findAppGitByAppId(appId);
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
  async pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string) {
    const organizationId = user.organizationId;

    const appGit = await this.sshGitSyncUtilityService.findAppGitByAppId(appId);
    const orgGit = appGit.orgGit;
    const projectRoot = SSHGitSyncService.PROJECT_ROOT;
    const appName = appMetaBody?.gitAppName;
    const versionName = appMetaBody?.gitVersionName;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
    );
    try {
      await this.sshGitSyncUtilityService.gitClone(gitRepoPath, orgGit);
      const resourceJson = await this.sshGitSyncUtilityService.readAppJson(user, appName, versionName, gitRepoPath);

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

      const schemaUnifiedAppParams = this.sshGitSyncUtilityService.validateAppJsonForImport(
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

      await this.sshGitSyncUtilityService.UpdateGitApp(schemaUnifiedAppParams, app);
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
      this.sshGitSyncUtilityService.updateAppGit(appGit.id, appGitBody);
      return app;
    } catch (err) {
      throw new BadRequestException('Error while pulling changes due to ', err);
    }
  }
  async setFinalizeConfig(userId: string, organizationId: string, organizationGitId: string) {
    const orgGit = await this.organizationGitRepository.findOne({
      where: {
        id: organizationGitId,
        organizationId,
      },
    });
    if (!orgGit) throw new BadRequestException('Wrong organization git Id');
    const projectRoot = SSHGitSyncService.PROJECT_ROOT;
    const time = new Date();
    const initPath = path.join(projectRoot, `${userId}-${orgGit.organizationId}-testing-${time.getTime()}`);
    const connection = await this.sshGitSyncUtilityService.testGitConnection(orgGit, initPath);
    const connectionStatus = connection.connectionStatus;
    if (!connectionStatus) {
      throw new BadRequestException(connection.connectionMessage);
    }
    const sshConfigs = await this.sshGitSyncUtilityService.findSSHConfigs(orgGit?.id);
    orgGit.isEnabled = true;
    orgGit.gitType = GITConnectionType.GITHUB_SSH;
    sshConfigs.isFinalized = true;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.save(sshConfigs);
      return await manager.save(orgGit);
    });
  }
  async createOrganizationGit(organizationGitCreateDto: OrganizationGitCreateDto): Promise<OrganizationGitSync> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let orgGit = await this.sshGitSyncUtilityService.findOrgGitByOrganizationId(
        organizationGitCreateDto?.organizationId
      );
      if (!orgGit) {
        orgGit = manager.create(OrganizationGitSync, organizationGitCreateDto);
        await manager.save(orgGit);
      }
      const orgGitSSH = new OrganizationGitSsh();
      await this.sshGitSyncUtilityService.setSshKey(orgGitSSH);
      orgGitSSH.gitUrl = organizationGitCreateDto.gitUrl;
      orgGitSSH.configId = orgGit.id;
      // Default key type while creation is ed25519 : this should be fetched from backend ideally (pending to review : rohan)
      orgGitSSH.keyType = 'ed25519';
      const result = await manager.create(OrganizationGitSsh, orgGitSSH);
      await manager.save(orgGitSSH);
      delete result.sshPrivateKey;
      Object.assign(result, orgGit);
      return result;
    });
  }
  updateOrgGit(organizationId: string, id: string, updateOrgGitDto: OrganizationGitUpdateDto): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const orgGit = await manager.findOneOrFail(OrganizationGitSync, { where: { organizationId, id } });
      // Handle autoCommit update - check if autoCommit property exists in the DTO -> Needs more review not changing it as of now
      if (orgGit && 'autoCommit' in updateOrgGitDto) {
        await manager.update(
          OrganizationGitSync,
          { id: orgGit.id },
          {
            autoCommit: updateOrgGitDto.autoCommit,
          }
        );
        return;
      }

      // Handle other updates
      const { keyType } = updateOrgGitDto;
      if (updateOrgGitDto?.gitUrl || keyType) {
        await this.sshGitSyncUtilityService.setSshKey(updateOrgGitDto, keyType ? keyType : 'ed25519');
      }

      const sshConfigs = await this.sshGitSyncUtilityService.findSSHConfigs(orgGit?.id, manager);
      if (orgGit && sshConfigs) {
        await manager.update(OrganizationGitSsh, sshConfigs?.id, updateOrgGitDto);
      }
    });
  }
  async getProviderConfigs(userOrganizationId: string, organizationId: string) {
    const orgGit = (await this.baseGitUtilService.getOrganizationById(
      userOrganizationId,
      organizationId
    )) as OrganizationGitSshConfigDto;
    if (!orgGit) {
      return;
    }
    orgGit.hasProviderConfigs = false;
    const providerConfigs = await this.sshGitSyncUtilityService.findSSHConfigs(orgGit.id);
    if (providerConfigs) {
      orgGit.sshPublicKey = providerConfigs?.sshPublicKey;
      orgGit.gitUrl = providerConfigs?.gitUrl;
      orgGit.isFinalized = providerConfigs?.isFinalized;
      orgGit.keyType = providerConfigs?.keyType;
      orgGit.hasProviderConfigs = true;
    }
    return orgGit;
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
    const providerConfigs = await this.sshGitSyncUtilityService.findSSHConfigs(organizationGit?.id);
    return decamelizeKeys({
      isEnabled: organizationGit.isEnabled,
      isFinalized: providerConfigs.isFinalized,
      id: organizationGit.id,
    });
  }
  async deleteConfig(organizationId: string, organizationGitId: string): Promise<void> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.findOneOrFail(OrganizationGitSsh, {
        where: { configId: organizationGitId },
      });
      await manager.delete(OrganizationGitSsh, { configId: organizationGitId });
      // After deleting the configs : we are disabling the enabled status and updating auto commit to false
      await this.sshGitSyncUtilityService.updateGitSyncSettings(organizationId, organizationGitId, false, false);
    });
  }
  saveProviderConfig(userId: string, organizationId: string, configData: ProviderConfigDTO): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
