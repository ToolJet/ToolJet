import { Injectable } from '@nestjs/common';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { Repository, EntityManager, Equal } from 'typeorm';
import * as Crypto from 'crypto';
import * as Sshpk from 'sshpk';
import { InjectRepository } from '@nestjs/typeorm';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import * as NodeGit from '@figma/nodegit';
import { extractWorkFromUrl } from 'src/helpers/utils.helper';

import { App } from 'src/entities/app.entity';
import { User } from 'src/entities/user.entity';
// import { ExportAppDto, ExportResourcesDto, ExportTooljetDatabaseDto } from '@dto/export-resources.dto';
import * as fs from 'fs';
import { AppVersion } from 'src/entities/app_version.entity';
import { OrganizationGitSsh } from '@entities/gitsync_entities/organization_git_ssh.entity';
import { BaseGitUtilService } from '@modules/git-sync/base-git-util.service';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { AppsService } from '@modules/apps/service';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
@Injectable()
export class SSHGitSyncUtilityService extends BaseGitUtilService {
  constructor(
    @InjectRepository(AppGitSync)
    appGitRepository: Repository<AppGitSync>,
    @InjectRepository(OrganizationGitSync)
    organizationGitRepository: Repository<OrganizationGitSync>,
    @InjectRepository(AppVersion)
    appVersionsRepository: Repository<AppVersion>,
    appsService: AppsService,
    importExportResourcesService: ImportExportResourcesService,
    licenseTermsService: LicenseTermsService,
    @InjectRepository(OrganizationGitSsh)
    private organizationGitSshRepository: Repository<OrganizationGitSsh>
  ) {
    super(
      appGitRepository,
      organizationGitRepository,
      appVersionsRepository,
      appsService,
      importExportResourcesService,
      licenseTermsService
    );
  }
  async setSshKey(orgGitSsh: Partial<OrganizationGitSsh>, keyType: 'ed25519' | 'rsa' = 'ed25519') {
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
          orgGitSsh.sshPublicKey = sshRsa;
          orgGitSsh.sshPrivateKey = privateKey as unknown as string;
          resolve(orgGitSsh);
        });
      else {
        Crypto.generateKeyPair('ed25519', keyOptions, (err: Error | null, publicKey, privateKey) => {
          if (err) {
            reject(err);
          }
          const pemKey = Sshpk.parseKey(publicKey as undefined as string, 'pem');
          const sshRsa = pemKey.toString('ssh');
          orgGitSsh.sshPublicKey = sshRsa;
          orgGitSsh.sshPrivateKey = privateKey as unknown as string;
          resolve(orgGitSsh);
        });
      }
    });
  }
  async createAppGit(CreateBody: any): Promise<AppGitSync> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const appGit = manager.create(AppGitSync, CreateBody);
      return await manager.save(appGit);
    });
  }
  async initializeGitRepo(initPath: string, orgGit: OrganizationGitSync) {
    const isBare = 0;
    const repo = await NodeGit.Repository.init(initPath, isBare);
    try {
      // requires a fix
      const sshConfigs = await this.findSSHConfigs(orgGit.id);
      NodeGit.Remote.create(repo, 'origin', sshConfigs.gitUrl);
    } catch (err) {
      console.error('Origin already exist, continuing with the other operation');
    }
    return repo;
  }
  async gitClone(repoPath: string, orgGit: OrganizationGitSync, depth = 1) {
    const certificateCheck = () => 0;
    let callbackCalled = false;
    // requires a fix
    const sshConfigs = await this.findSSHConfigs(orgGit.id);
    const gitUser = extractWorkFromUrl(sshConfigs.gitUrl);
    const cloneOptions = {
      ...(process.env.GITSYNC_TARGET_BRANCH && { checkoutBranch: process.env.GITSYNC_TARGET_BRANCH }),
      fetchOpts: {
        callbacks: {
          certificateCheck,
          credentials: () => {
            if (callbackCalled) return;
            callbackCalled = true;
            return NodeGit.Credential.sshKeyMemoryNew(gitUser, sshConfigs.sshPublicKey, sshConfigs.sshPrivateKey, '');
          },
        },
        depth: depth,
      },
    };
    return NodeGit.Clone(sshConfigs.gitUrl, repoPath, cloneOptions);
  }
  async pushRepo(repo: NodeGit.Repository, appGit: AppGitSync, branchName: string, remoteName: string) {
    const orgGit = appGit.orgGit;
    const sshConfigs = await this.findSSHConfigs(orgGit.id);
    // requires a fix
    const gitUser = extractWorkFromUrl(sshConfigs.gitUrl);
    // requires a fix
    const credentials: NodeGit.Credential = NodeGit.Credential.sshKeyMemoryNew(
      gitUser,
      sshConfigs.sshPublicKey,
      sshConfigs.sshPrivateKey,
      ''
    );
    const remote = await repo.getRemote(remoteName);
    return remote.push([`refs/heads/${branchName}:refs/heads/${branchName}`], {
      callbacks: {
        credentials: () => credentials,
      },
    });
  }
  async testGitConnection(orgGit: OrganizationGitSync, initPath: string) {
    if (!fs.existsSync(initPath)) {
      fs.mkdirSync(initPath, { recursive: true });
    }
    try {
      const repo = await this.initializeGitRepo(initPath, orgGit);
      const remote = await repo.getRemote('origin');
      const certificateCheck = () => 0;
      let callbackCalled = false;
      const sshConfigs = await this.findSSHConfigs(orgGit.id);
      // requires a fix
      const gitUser = extractWorkFromUrl(sshConfigs.gitUrl);

      const connectionStatusCode = await remote.connect(NodeGit.Enums.DIRECTION.PUSH, {
        certificateCheck,
        credentials: () => {
          if (callbackCalled) return;
          callbackCalled = true;
          // requires a fix
          return NodeGit.Credential.sshKeyMemoryNew(gitUser, sshConfigs.sshPublicKey, sshConfigs.sshPrivateKey, '');
        },
      });

      if (process.env.GITSYNC_TARGET_BRANCH) {
        await remote.fetch([], {
          callbacks: {
            credentials: () => {
              // requires a fix
              return NodeGit.Credential.sshKeyMemoryNew(gitUser, sshConfigs.sshPublicKey, sshConfigs.sshPrivateKey, '');
            },
          },
        });
        await NodeGit.Branch.lookup(repo, `origin/${process.env.GITSYNC_TARGET_BRANCH}`, 2);
      }
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
      if (connectionMessage == 'Error: callback failed to initialize SSH credentials') {
        connectionMessage = 'SSH key is not added in deployed keys of git repository';
      } else if (
        process.env.GITSYNC_TARGET_BRANCH &&
        connectionMessage.includes('cannot locate remote-tracking branch')
      ) {
        connectionMessage = 'Cannot locate remote-tracking branch';
        // To Do Later -> Replace this with the actual error message to be shown in the frontend and remove all checks from the frontend
      }
      return {
        connectionStatus: false,
        connectionMessage: connectionMessage,
        errCode: -20,
      };
    }
  }
  //need to review this --> If it can be done better or not
  async gitCommit(repo: NodeGit.Repository, commitMessage: string, commitingUser: User, appGit: AppGitSync) {
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
          throw err;
        });
    }
  }
  //   not used as of now --> to remove later if not required
  private async deleteAppVersions(appVersions: AppVersion[], app: App) {
    for (const version of appVersions) this.appsService.deleteVersion(app, version);
  }
  async findSSHConfigs(orgGitId: string, manager?: EntityManager): Promise<OrganizationGitSsh> {
    if (manager) {
      return await manager.findOne(OrganizationGitSsh, {
        where: {
          configId: Equal(orgGitId),
        },
      });
    }
    return await this.organizationGitSshRepository.findOne({
      where: {
        configId: Equal(orgGitId),
      },
    });
  }
  async findAppGitByAppIdSSH(appId: string): Promise<AppGitSync> {
    return this.appGitRepository.findOne({
      where: { appId: appId },
      relations: ['orgGit', 'orgGit.gitSsh'],
    });
  }
}
