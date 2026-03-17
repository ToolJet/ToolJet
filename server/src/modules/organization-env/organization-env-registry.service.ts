import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EncryptionService } from '../encryption/service';
import { OrganizationRepository } from '@modules/organizations/repository';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { GIT_ENV_KEYS, REQUIRED_KEYS } from '@modules/organization-env/constants';
import { filePathForEnvVars } from '../../../scripts/database-config-utils';
import { GitHttpsEnvConfig, GitLabEnvConfig, GitSshEnvConfig } from '@modules/organization-env/types';

@Injectable()
export class OrganizationEnvRegistryService implements OnModuleInit {
  private readonly logger = new Logger(OrganizationEnvRegistryService.name);

  // workspaceId → key → encrypted value
  private store: Map<string, Map<string, string>> = new Map();
  private isInitialized = false;
  private initializationPromise?: Promise<void>;

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly organizationRepository: OrganizationRepository
  ) { }

  async onModuleInit(): Promise<void> {
    await this.ensureInitialized();
  }

  async initialize(): Promise<void> {
    await this.ensureInitialized();
  }

  /**
   * Force a re-scan of all workspace env files.
   */
  async reload(): Promise<void> {
    this.logger.log('Reloading workspace env files...');
    await this.scanWorkspaceEnvFiles();
    this.isInitialized = true;
    this.logger.log('Reload complete');
  }

  /**
   * Check whether all required keys for a provider are present for a workspace.
   */
  hasGitHttpsConfig(workspaceId: string): boolean {
    return this.hasRequiredKeys(workspaceId, REQUIRED_KEYS.HTTPS);
  }

  hasGitSshConfig(workspaceId: string): boolean {
    return this.hasRequiredKeys(workspaceId, REQUIRED_KEYS.SSH);
  }

  hasGitLabConfig(workspaceId: string): boolean {
    return this.hasRequiredKeys(workspaceId, REQUIRED_KEYS.GITLAB);
  }

  /**
   * Returns typed config for HTTPS provider, or null if any required key is missing.
   */
  async getGitHttpsConfig(workspaceId: string): Promise<GitHttpsEnvConfig | null> {
    await this.ensureInitialized();
    if (!this.hasGitHttpsConfig(workspaceId)) return null;

    const k = GIT_ENV_KEYS.HTTPS;
    const [url, branch, appId, installationId, privateKey, enterpriseUrl, enterpriseApiUrl] = await Promise.all([
      this.getValue(workspaceId, k.URL),
      this.getValue(workspaceId, k.BRANCH),
      this.getValue(workspaceId, k.APP_ID),
      this.getValue(workspaceId, k.INSTALLATION_ID),
      this.getValue(workspaceId, k.PRIVATE_KEY),
      this.getValue(workspaceId, k.ENTERPRISE_URL),
      this.getValue(workspaceId, k.ENTERPRISE_API_URL),
    ]);

    // Recheck after decryption — decryption failures return undefined
    if (!url || !branch || !appId || !installationId || !privateKey) {
      this.logger.warn(`HTTPS env config incomplete after decryption for workspaceId=${workspaceId}`);
      return null;
    }

    return {
      httpsUrl: url,
      githubBranch: branch,
      githubAppId: appId,
      githubInstallationId: installationId,
      githubPrivateKey: privateKey,
      ...(enterpriseUrl && { githubEnterpriseUrl: enterpriseUrl }),
      ...(enterpriseApiUrl && { githubEnterpriseApiUrl: enterpriseApiUrl }),
    };
  }

  async getGitSshConfig(workspaceId: string): Promise<GitSshEnvConfig | null> {
    await this.ensureInitialized();
    if (!this.hasGitSshConfig(workspaceId)) return null;

    const k = GIT_ENV_KEYS.SSH;
    const [gitUrl, branch, privateKey, publicKey, keyType] = await Promise.all([
      this.getValue(workspaceId, k.GIT_URL),
      this.getValue(workspaceId, k.BRANCH),
      this.getValue(workspaceId, k.PRIVATE_KEY),
      this.getValue(workspaceId, k.PUBLIC_KEY),
      this.getValue(workspaceId, k.KEY_TYPE),
    ]);

    if (!gitUrl || !branch || !privateKey || !publicKey || !keyType) {
      this.logger.warn(`SSH env config incomplete after decryption for workspaceId=${workspaceId}`);
      return null;
    }

    return { gitUrl, gitBranch: branch, sshPrivateKey: privateKey, sshPublicKey: publicKey, keyType };
  }

  async getGitLabConfig(workspaceId: string): Promise<GitLabEnvConfig | null> {
    await this.ensureInitialized();
    if (!this.hasGitLabConfig(workspaceId)) return null;

    const k = GIT_ENV_KEYS.GITLAB;
    const [url, branch, projectId, accessToken, enterpriseUrl] = await Promise.all([
      this.getValue(workspaceId, k.URL),
      this.getValue(workspaceId, k.BRANCH),
      this.getValue(workspaceId, k.PROJECT_ID),
      this.getValue(workspaceId, k.PROJECT_ACCESS_TOKEN),
      this.getValue(workspaceId, k.ENTERPRISE_URL),
    ]);

    if (!url || !branch || !projectId) {
      this.logger.warn(`GitLab env config incomplete after decryption for workspaceId=${workspaceId}`);
      return null;
    }

    return {
      gitlabUrl: url,
      gitlabBranch: branch,
      gitlabProjectId: projectId,
      ...(accessToken && { gitlabProjectAccessToken: accessToken }),
      ...(enterpriseUrl && { gitlabEnterpriseUrl: enterpriseUrl }),
    };
  }

  private async getValue(workspaceId: string, key: string): Promise<string | undefined> {
    const encryptedValue = this.store.get(workspaceId)?.get(key);
    if (!encryptedValue) return undefined;

    try {
      return await this.encryptionService.decryptColumnValue('workspace_env', workspaceId, encryptedValue);
    } catch {
      this.logger.warn(`Failed to decrypt workspace env value for workspaceId=${workspaceId} key=${key}`);
      return undefined;
    }
  }

  private hasRequiredKeys(workspaceId: string, keys: readonly string[]): boolean {
    const workspaceStore = this.store.get(workspaceId);
    if (!workspaceStore) return false;
    return keys.every((key) => workspaceStore.has(key));
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        await this.scanWorkspaceEnvFiles();
        this.isInitialized = true;
      })().finally(() => {
        this.initializationPromise = undefined;
      });
    }

    await this.initializationPromise;
  }

  private async scanWorkspaceEnvFiles(): Promise<void> {
    const nextStore: Map<string, Map<string, string>> = new Map();

    const envFilePath = filePathForEnvVars(process.env.NODE_ENV);
    const envDir = path.dirname(envFilePath);

    if (!fs.existsSync(envDir)) {
      this.logger.warn(`Env directory not found: ${envDir}`);
      this.store = nextStore;
      return;
    }

    const workspaceEnvFiles = (await fs.promises.readdir(envDir)).filter((file) => file.startsWith('.tj_env.')).sort();

    if (!workspaceEnvFiles.length) {
      this.logger.debug('No workspace env files found');
      this.store = nextStore;
      return;
    }

    for (const fileName of workspaceEnvFiles) {
      const workspaceIdentifier = fileName.replace('.tj_env.', '');
      if (!workspaceIdentifier) continue;

      this.logger.debug(`Processing ${fileName} (identifier: ${workspaceIdentifier})`);

      const workspaceId = await this.resolveWorkspaceId(workspaceIdentifier);
      if (!workspaceId) {
        this.logger.warn(`Skipping ${fileName}: workspace "${workspaceIdentifier}" not found`);
        continue;
      }

      const filePath = path.join(envDir, fileName);

      let parsed: Record<string, string>;
      try {
        parsed = dotenv.parse(await fs.promises.readFile(filePath));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to read/parse ${fileName}: ${errorMessage}`);
        continue; // skip bad file, don't abort the whole scan
      }

      const encryptedMap = new Map<string, string>();
      for (const [key, value] of Object.entries(parsed)) {
        try {
          const encrypted = await this.encryptionService.encryptColumnValue('workspace_env', workspaceId, value);
          encryptedMap.set(key, encrypted);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to encrypt key=${key} for workspaceId=${workspaceId}: ${errorMessage}`);
          // skip this key — partial config will be caught by hasRequiredKeys
        }
      }

      nextStore.set(workspaceId, encryptedMap);
      this.logger.debug(
        `Loaded ${encryptedMap.size} keys for workspaceId=${workspaceId} from ${fileName}: [${[...encryptedMap.keys()].join(', ')}]`
      );
    }

    // Atomic swap — ongoing reads against the old store are unaffected mid-scan
    this.store = nextStore;
    this.logger.log(`Workspace env registry loaded: ${this.store.size} workspace(s)`);
  }

  private async resolveWorkspaceId(identifier: string): Promise<string | undefined> {
    const isUuid = this.#isUUID(identifier);
    const organization = await this.organizationRepository.findOne({
      where: isUuid ? { id: identifier } : { slug: identifier },
      select: { id: true },
    });
    return organization?.id;
  }

  #isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
