/* eslint-disable no-prototype-builtins */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, getManager } from 'typeorm';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto } from '@dto/organization_git.dto';
import { AppImportExportService, convertSinglePageSchemaToMultiPageSchema } from './app_import_export.service';
import { AppsService } from './apps.service';
import {
  catchDbException,
  dbTransactionWrap,
  extractMajorVersion,
  isTooljetVersionWithNormalizedAppDefinitionSchem,
  extractWorkFromUrl,
} from 'src/helpers/utils.helper';
import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@dto/app_git.dto';
import * as Crypto from 'crypto';
import { User } from 'src/entities/user.entity';
import * as path from 'path';
import * as NodeGit from '@figma/nodegit';
import * as fs from 'fs';
import { AppVersion } from 'src/entities/app_version.entity';
import * as Sshpk from 'sshpk';
import { App } from 'src/entities/app.entity';
import { AppUpdateDto } from '@dto/app-update.dto';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { ExportAppDto, ExportResourcesDto, ExportTooljetDatabaseDto } from '@dto/export-resources.dto';
import { ImportExportResourcesService } from './import_export_resources.service';
import { ImportAppDto, ImportResourcesDto, ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { TooljetDbImportExportService } from './tooljet_db_import_export_service';

@Injectable()
export class GitSyncService {
  private static PROJECT_ROOT = 'tooljet/gitsync';
  constructor(
    @InjectRepository(AppGitSync)
    private appGitRepository: Repository<AppGitSync>,

    @InjectRepository(OrganizationGitSync)
    private organizationGitRepository: Repository<OrganizationGitSync>,

    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>,

    private appImportExportService: AppImportExportService,
    private importExportResourcesService: ImportExportResourcesService,
    private tooljetDbImportExportService: TooljetDbImportExportService,
    private appsService: AppsService
  ) {}

  async findAppGitById(appGitId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { id: appGitId },
      relations: ['orgGit'],
    });
  }

  async findOrgGitById(orgGitId: string): Promise<OrganizationGitSync> {
    return this.organizationGitRepository.findOne({
      where: { id: orgGitId },
    });
  }

  async findOrgGitByOrganizationId(organizationId: string): Promise<OrganizationGitSync> {
    return this.organizationGitRepository.findOne({
      where: { organizationId: organizationId },
    });
  }

  async findAppGitByAppId(appId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { appId: appId },
      relations: ['orgGit'],
    });
  }

  async deleteConfig(organizationGit: string) {
    await this.organizationGitRepository.delete(organizationGit);
  }

  async createOrganizationGit(organizationGitCreatedto: OrganizationGitCreateDto): Promise<OrganizationGitSync> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const orgGit = manager.create(OrganizationGitSync, organizationGitCreatedto);
      await this.setSshKey(orgGit);

      const result = await manager.save(orgGit);
      delete result.sshPrivateKey;
      return result;
    });
  }

  private async setSshKey(
    orgGit: OrganizationGitSync | OrganizationGitUpdateDto,
    keyType: 'ed25519' | 'rsa' = 'ed25519'
  ) {
    const keyOptions = {
      // modulusLength: 1024,
      ...(keyType == 'rsa' && { modulusLength: 1024 }),
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    };

    return new Promise<any | void>((resolve, reject) => {
      if (keyType == 'rsa')
        Crypto.generateKeyPair('rsa', keyOptions, (err: Error | null, publicKey, privateKey) => {
          if (err) {
            reject(err);
          }
          const pemKey = Sshpk.parseKey(publicKey as undefined as string, 'pem');
          const sshRsa = pemKey.toString('ssh');
          orgGit.sshPublicKey = sshRsa;
          orgGit.sshPrivateKey = privateKey as unknown as string;
          resolve(orgGit);
        });
      else {
        Crypto.generateKeyPair('ed25519', keyOptions, (err: Error | null, publicKey, privateKey) => {
          if (err) {
            reject(err);
          }
          const pemKey = Sshpk.parseKey(publicKey as undefined as string, 'pem');
          const sshRsa = pemKey.toString('ssh');
          orgGit.sshPublicKey = sshRsa;
          orgGit.sshPrivateKey = privateKey as unknown as string;
          resolve(orgGit);
        });
      }
    });
  }

  async updateOrgGit(id: string, updateOrgGitDto: OrganizationGitUpdateDto) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { keyType } = updateOrgGitDto;
      if (updateOrgGitDto?.gitUrl || keyType) await this.setSshKey(updateOrgGitDto, keyType ? keyType : 'ed25519');
      return await manager.update(OrganizationGitSync, { id }, updateOrgGitDto);
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

  //Check for other way to test connection
  private async testGitConnection(orgGit: OrganizationGitSync, initPath: string) {
    if (!fs.existsSync(initPath)) {
      fs.mkdirSync(initPath, { recursive: true });
    }
    try {
      const repo = await this.initializeGitRepo(initPath, orgGit);
      const remote = await repo.getRemote('origin');
      const certificateCheck = () => 0;
      let callbackCalled = false;
      const gitUser = extractWorkFromUrl(orgGit.gitUrl);

      const connectionStatusCode = await remote.connect(NodeGit.Enums.DIRECTION.PUSH, {
        certificateCheck,
        credentials: () => {
          if (callbackCalled) return;
          callbackCalled = true;
          return NodeGit.Credential.sshKeyMemoryNew(gitUser, orgGit.sshPublicKey, orgGit.sshPrivateKey, '');
        },
      });

      //Can we make this asyncronous instead of await
      await this.deleteDir(initPath);

      if (!connectionStatusCode) {
        return {
          connectionStatus: true,
          connectionMessage: 'Successfully Coneected',
          errCode: 0,
        };
      } else {
        return {
          connectionStatus: false,
          connectionMessage: 'Not Able to connect',
          errCode: connectionStatusCode,
        };
      }
    } catch (err) {
      //Can we make this asyncronous instead of await

      await this.deleteDir(initPath);
      console.error('Cannot connect to git repo : ', err);
      let connectionMessage = `${String(err)
        .replace(/^Error: ERROR:\s*/, '')
        .replace(/\s+/g, ' ')
        .replace(/\n/g, '\\n')}`;
      if (connectionMessage == 'Error: callback failed to initialize SSH credentials')
        connectionMessage = 'SSH key is not added in deployed keys of git repository';
      return {
        connectionStatus: false,
        connectionMessage: connectionMessage,
        errCode: -20,
      };
    }
  }

  async setFinalizeConfig(
    userId: string,
    organizationGitId: string,
    organizationGitUpdateDto: OrganizationGitUpdateDto
  ) {
    const orgGit = await this.organizationGitRepository.findOne({
      where: {
        id: organizationGitId,
      },
    });
    if (!orgGit) throw new BadRequestException('Wrong organization git Id');
    const projectRoot = GitSyncService.PROJECT_ROOT;
    const time = new Date();
    const initPath = path.join(projectRoot, `${userId}-${orgGit.organizationId}-testing-${time.getTime()}`);
    if (organizationGitUpdateDto.isEnabled) {
      const connection = await this.testGitConnection(orgGit, initPath);
      const connectionStatus = connection.connectionStatus;
      if (!connectionStatus) {
        return connection;
      }
    }
    orgGit.isEnabled = organizationGitUpdateDto.isEnabled;
    orgGit.isFinalized = organizationGitUpdateDto.isFinalized;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(orgGit);
    });
  }

  async checkSyncApp(user: User, version: AppVersion, organizationId: string) {
    const app = version.app;
    const projectRoot = GitSyncService.PROJECT_ROOT;
    const time = new Date();
    const initPath = path.join(projectRoot, `${user.id}-${organizationId}-${app.name}-testing-${time.getTime()}`);
    const appGit = await this.findAppGitByAppId(app.id);
    if (appGit) {
      if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');
      const connection = await this.testGitConnection(appGit.orgGit, initPath);
      const connectionStatus = connection?.connectionStatus;
      if (connectionStatus) {
        return appGit;
      } else return connection;
    } else {
      const organizationGit = await this.findOrgGitByOrganizationId(organizationId);
      if (organizationGit) {
        if (!organizationGit.isEnabled) throw new BadRequestException('Git is not enabled');
        const connection = await this.testGitConnection(organizationGit, initPath);
        const connectionStatus = connection?.connectionStatus;
        if (connectionStatus) {
          const appGitBody = {
            gitAppName: app.name,
            gitAppId: app.id,
            organizationGitId: organizationGit.id,
            appId: app.id,
          };
          const appGit = await this.createAppGit(appGitBody);
          appGit.orgGit = organizationGit;
          return appGit;
        } else {
          return connection;
        }
      }
    }
    throw new NotFoundException('Git Configuration not found');
  }

  private async initializeGitRepo(initPath: string, orgGit: OrganizationGitSync) {
    const isBare = 0;
    const repo = await NodeGit.Repository.init(initPath, isBare);
    try {
      NodeGit.Remote.create(repo, 'origin', orgGit.gitUrl);
    } catch (err) {
      console.error('Origin already exist, continuing with the other operation');
    }
    return repo;
  }

  async gitPushApp(
    user: User,
    appGitId: string,
    branchName: string,
    appGitPushBody: AppGitPushDto,
    version: AppVersion,
    remoteName = 'origin'
  ) {
    const appGit = await this.findAppGitById(appGitId);
    if (!appGit) throw new BadRequestException('Need to set up app git info before pushing the app');
    if (!appGit.orgGit.isEnabled) throw new BadRequestException('Git is not enabled');

    const app = version.app;

    const projectRoot = GitSyncService.PROJECT_ROOT;
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
      const repo = await this.gitClone(gitRepoPath, organizationGit);
      const repoPath = path.dirname(repo.path());

      await this.WriteAppFile(user, repoPath, appGit, version, app);
      await this.writeMetaFile(user, repoPath, appGit, appGitPushBody);
      await this.gitCommit(repo, appGitPushBody.lastCommitMessage, user, appGit);
      await this.pushRepo(repo, appGit, branchName, remoteName)
        .then(async () => {
          await this.deleteDir(gitRepoPath);
          appGit.lastPushDate = new Date();
          await dbTransactionWrap(async (manager: EntityManager) => {
            return await manager.save(AppGitSync, appGit);
          });
        })
        .catch((err) => {
          console.error(err);
          this.deleteDir(gitRepoPath);
        });
    } catch (err) {
      throw new BadRequestException('Issue while cloning');
    }
  }

  private async WriteAppFile(user: User, repoPath: string, appGit: AppGitSync, version: AppVersion, app: App) {
    const tables: ExportTooljetDatabaseDto[] = await this.appsService.findTooljetDbTables(app.id);
    const appList: ExportAppDto[] = [{ id: app.id, search_params: { version_id: version.id } }];
    const exportDto: ExportResourcesDto = {
      app: appList,
      tooljet_database: tables,
      organization_id: app.organizationId,
    };
    const result = await this.importExportResourcesService.export(user, exportDto);
    const resourceObject = { ...result, tooljet_version: globalThis.TOOLJET_VERSION };
    const appJson = JSON.stringify(resourceObject, null, 2);
    let appPath = path.join(repoPath, appGit.gitAppName);

    if (app.name != appGit.gitAppName) {
      const newPath = path.join(repoPath, app.name);
      if (fs.existsSync(appPath)) {
        fs.rename(appPath, newPath, (err) => {
          if (err) {
            console.error('Issue while renaming', err);
            this.deleteDir(repoPath);
            throw new BadRequestException('Error while writting JSON file');
          }
        });
      }
      appPath = newPath;
      appGit.gitAppName = app.name;
    }

    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true });
    }

    let filePath = path.join(appPath, `${appGit.gitVersionName}.json`);

    if (appGit.versionId != null && (appGit.gitVersionId != version.id || appGit.gitVersionName != version.name)) {
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            this.deleteDir(repoPath);
            throw new BadRequestException('Error while renaming app version');
          }
        });
      }
    }
    appGit.gitVersionName = version.name;
    appGit.gitVersionId = version.id;
    appGit.versionId = version.id;
    filePath = path.join(appPath, `${appGit.gitVersionName}.json`);
    try {
      await fs.promises.writeFile(filePath, appJson);
      return `${appGit.gitAppName}/${appGit.gitVersionName}.json`;
    } catch (err) {
      this.deleteDir(repoPath);
      throw new BadRequestException(`Error writing file "${filePath}": ${err}`);
    }
  }

  private async gitClone(repoPath: string, orgGit: OrganizationGitSync, depth = 1) {
    const certificateCheck = () => 0;
    let callbackCalled = false;
    const gitUser = extractWorkFromUrl(orgGit.gitUrl);
    const cloneOptions = {
      fetchOpts: {
        callbacks: {
          certificateCheck,
          credentials: () => {
            if (callbackCalled) return;
            callbackCalled = true;
            return NodeGit.Credential.sshKeyMemoryNew(gitUser, orgGit.sshPublicKey, orgGit.sshPrivateKey, '');
          },
        },
        depth: depth,
      },
    };
    return NodeGit.Clone(orgGit.gitUrl, repoPath, cloneOptions);
  }

  async renameAppOrVersion(
    user: User,
    appId: string,
    prevName = '',
    renameVersionFlag = false,
    branchName = 'master',
    remoteName = 'origin'
  ) {
    const appGit = await this.findAppGitByAppId(appId);
    if (!appGit) return;
    if (appGit.orgGit.isEnabled == false) return;
    const version = await this.appVersionsRepository.findOne({
      where: { id: appGit.versionId },
      relations: ['app'],
    });
    if (!version) return;

    const appGitPushBody: AppGitPushDto = {
      gitAppName: appGit.gitAppName,
      lastCommitMessage: `${
        renameVersionFlag ? `Version ${prevName} of app ${appGit.gitAppName} ` : `App ${prevName}`
      }  is renamed to ${renameVersionFlag ? appGit.gitVersionName : appGit.gitAppName}`,
      versionId: appGit.gitVersionId,
      gitVersionName: appGit.gitVersionName,
    };
    return this.gitPushApp(user, appGit.id, branchName, appGitPushBody, version, remoteName);
  }

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
    const commitMessageWithDesc = `Version ${appGit.gitVersionName} Of ${appGit.gitAppName}: ${commitMessage}`;
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

  private async deleteDir(dirPath: string) {
    try {
      fs.rmdir(dirPath, { recursive: true }, () => {});
    } catch {
      console.error('Not able to remove directory:', dirPath);
    }
  }

  private async writeMetaFile(user: User, repoPath: string, appGit: AppGitSync, appGitPushBody: AppGitPushDto) {
    const metaDr = path.join(repoPath, '.meta');
    const metaFile = path.join(metaDr, 'meta.json');
    let appMeta = {};
    if (!fs.existsSync(metaDr)) {
      fs.mkdirSync(metaDr, { recursive: true });
    } else {
      const appMetaContent = fs.readFileSync(metaFile, 'utf8');
      appMeta = JSON.parse(appMetaContent);
    }
    appMeta[appGit.gitAppId] = {
      gitAppName: appGit.gitAppName,
      lastCommitMessage: appGitPushBody.lastCommitMessage,
      gitVersionId: appGit.gitVersionId,
      lastpushDate: new Date(),
      gitVersionName: appGit.gitVersionName,
      lastCommitUser: `${user.firstName ? user.firstName : ''} ${user.lastName ? user.lastName : ''}`,
    };
    const appMetaString = JSON.stringify(appMeta, null, 2);
    try {
      await fs.promises.writeFile(metaFile, appMetaString);
      return `${appGit.gitAppName}/${appGit.gitVersionName}.json`;
    } catch (err) {
      this.deleteDir(repoPath);
      throw new Error(`Error writing file "${metaFile}": ${err}`);
    }
  }

  async gitPullAppInfo(user: User, appId?: string) {
    const organizationId = user.organizationId;
    const orgGit = await this.findOrgGitByOrganizationId(organizationId);
    if (!orgGit) throw new NotFoundException('Git Configuration does not exist');
    if (!orgGit.isEnabled) throw new BadRequestException('Git Sync is not enabled');
    const projectRoot = GitSyncService.PROJECT_ROOT;
    const time = new Date();
    const gitRepoPath = path.join(projectRoot, `${user.id}-${organizationId}-${time.getTime()}`);
    let metaData = {};
    try {
      if (!fs.existsSync(gitRepoPath)) {
        fs.mkdirSync(gitRepoPath, { recursive: true });
      }

      await this.gitClone(gitRepoPath, orgGit);
      const metaFilePath = path.join(gitRepoPath, '.meta', 'meta.json');
      if (fs.existsSync(metaFilePath)) {
        const appMetaContent = fs.readFileSync(metaFilePath, 'utf8');
        metaData = JSON.parse(appMetaContent);
        for (const key in metaData) {
          if (metaData.hasOwnProperty(key)) {
            const value = metaData[key];
            const appName = await this.appsService.findByAppName(value?.gitAppName, organizationId);
            const appNameExist = appName ? 'EXIST' : 'NOT_EXIST';
            metaData[key] = { ...value, appNameExist };
          }
        }
        // eslint-disable-next-line no-prototype-builtins
        if (appId) {
          const appGit = await this.findAppGitByAppId(appId);
          if (!appGit) throw new BadRequestException('This is not git pulled app');
          if (!metaData.hasOwnProperty(appGit.gitAppId))
            throw new BadRequestException('App is not present in repo, try to recreate app from git');
          metaData = metaData[appGit.gitAppId];
        }
      }
      await this.deleteDir(gitRepoPath);
      return { metaData, orgGit };
    } catch (err) {
      this.deleteDir(gitRepoPath);
      throw BadRequestException;
    }
  }

  async createGitApp(user: User, appMetaBody: AppGitPullDto) {
    const organizationId = user.organizationId;
    const orgGit = await this.findOrgGitByOrganizationId(organizationId);
    const projectRoot = GitSyncService.PROJECT_ROOT;
    const appName = appMetaBody?.gitAppName;
    const versionName = appMetaBody?.gitVersionName;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
    );
    try {
      let app: App;
      await this.gitClone(gitRepoPath, orgGit);

      const resourceJson = await this.readAppJson(user, appName, versionName, gitRepoPath);
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
      this.createAppGit(appGitBody);
      return app;
    } catch (error) {
      await this.deleteDir(gitRepoPath);
      console.error(error);
      throw new BadRequestException(error);
    }
  }

  async pullGitAppChanges(user: User, appMetaBody: AppGitPullUpdateDto, appId: string) {
    const organizationId = user.organizationId;

    const appGit = await this.findAppGitByAppId(appId);
    const orgGit = appGit.orgGit;
    const projectRoot = GitSyncService.PROJECT_ROOT;
    const appName = appMetaBody?.gitAppName;
    const versionName = appMetaBody?.gitVersionName;
    const time = new Date();
    const gitRepoPath = path.join(
      projectRoot,
      `${user.id}-${organizationId}-${appName}-${versionName}-${time.getTime()}`
    );
    try {
      await this.gitClone(gitRepoPath, orgGit);
      const resourceJson = await this.readAppJson(user, appName, versionName, gitRepoPath);

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

      const schemaUnifiedAppParams = this.validateAppJsonForImport(appJson?.definition, appName);
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

      await this.UpdateGitApp(schemaUnifiedAppParams, app);
      await this.appImportExportService.setupImportedAppAssociations(
        getManager(),
        app,
        schemaUnifiedAppParams,
        user,
        {
          tooljet_database: tableNameMapping,
        },
        isNormalizedAppDefinitionSchema,
        importedAppTooljetVersion
      );
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
      this.updateAppGit(appGit.id, appGitBody);
      return app;
    } catch (err) {
      throw new BadRequestException('Error while pulling changes due to ', err);
    }
  }

  private async UpdateGitApp(schemaUnifiedAppParam: any, app: App) {
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
      return await this.appsService.update(app, appUpdateBody);
    }, [{ dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE, message: 'App name already exists' }]);
  }

  private async readAppJson(user: User, appName: string, versionName: string, gitRepoPath: string) {
    const appFilePath = path.join(gitRepoPath, appName, `${versionName}.json`);
    try {
      const appContent = fs.readFileSync(appFilePath, 'utf8');
      this.deleteDir(gitRepoPath);
      const appJson = JSON.parse(appContent);
      return appJson;
    } catch (err) {
      this.deleteDir(gitRepoPath);
      throw new BadRequestException('Error while reading git file');
    }
  }

  private validateAppJsonForImport(appJson, appName) {
    let appParams = appJson;
    if (appParams?.appV2) {
      appParams = { ...appParams.appV2 };
    }

    if (!appParams?.name) {
      throw new BadRequestException('Invalid params for app import');
    }

    const schemaUnifiedAppParams = appParams?.schemaDetails?.multiPages
      ? appParams
      : convertSinglePageSchemaToMultiPageSchema(appParams);
    schemaUnifiedAppParams.name = appName;
    return schemaUnifiedAppParams;
  }

  private async deleteAppVersions(appVersions: AppVersion[], app: App) {
    for (const version of appVersions) this.appsService.deleteVersion(app, version);
  }
}
