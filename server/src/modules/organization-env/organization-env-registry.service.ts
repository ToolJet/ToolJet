import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EncryptionService } from '../encryption/service';
import { OrganizationRepository } from '@modules/organizations/repository';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { GIT_ENV_KEYS, REQUIRED_KEYS } from '@modules/organization-env/constants';
import { GitHttpsEnvConfig, GitLabEnvConfig, GitSshEnvConfig } from '@modules/organization-env/types';
import { GITConnectionType } from 'src/entities/organization_git_sync.entity';
import {filePathForEnvVars} from "../../../scripts/database-config-utils";

type EnvProviderState = { isEnabled: boolean; isFinalized: boolean };
type ProviderSummary = { mapped: boolean; ready: boolean };

@Injectable()
export class OrganizationEnvRegistryService implements OnModuleInit {
  private readonly logger = new Logger(OrganizationEnvRegistryService.name);

  // workspaceId → key → encrypted value
  private store: Map<string, Map<string, string>> = new Map();
  private providerStateStore: Map<string, Map<GITConnectionType, EnvProviderState>> = new Map();
  private isInitialized = false;
  private initializationPromise?: Promise<void>;

  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationGitSyncRepository: OrganizationGitSyncRepository
  ) {}

  async onModuleInit(): Promise<void> {
    // await this.ensureInitialized();
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

  async getGitHttpsTemplateConfig(workspaceId: string): Promise<Partial<GitHttpsEnvConfig> | null> {
    await this.ensureInitialized();
    const workspaceStore = this.store.get(workspaceId);
    if (!workspaceStore) return null;

    const k = GIT_ENV_KEYS.HTTPS;
    const config: Partial<GitHttpsEnvConfig> = {};

    if (workspaceStore.has(k.URL)) config.httpsUrl = this.toTemplate(k.URL);
    if (workspaceStore.has(k.BRANCH)) config.githubBranch = this.toTemplate(k.BRANCH);
    if (workspaceStore.has(k.APP_ID)) config.githubAppId = this.toTemplate(k.APP_ID);
    if (workspaceStore.has(k.INSTALLATION_ID)) config.githubInstallationId = this.toTemplate(k.INSTALLATION_ID);
    if (workspaceStore.has(k.PRIVATE_KEY)) config.githubPrivateKey = this.toTemplate(k.PRIVATE_KEY);
    if (workspaceStore.has(k.ENTERPRISE_URL)) config.githubEnterpriseUrl = this.toTemplate(k.ENTERPRISE_URL);
    if (workspaceStore.has(k.ENTERPRISE_API_URL)) config.githubEnterpriseApiUrl = this.toTemplate(k.ENTERPRISE_API_URL);

    return Object.keys(config).length ? config : null;
  }

  async getGitSshTemplateConfig(workspaceId: string): Promise<Partial<GitSshEnvConfig> | null> {
    await this.ensureInitialized();
    const workspaceStore = this.store.get(workspaceId);
    if (!workspaceStore) return null;

    const k = GIT_ENV_KEYS.SSH;
    const config: Partial<GitSshEnvConfig> = {};

    if (workspaceStore.has(k.GIT_URL)) config.gitUrl = this.toTemplate(k.GIT_URL);
    if (workspaceStore.has(k.BRANCH)) config.gitBranch = this.toTemplate(k.BRANCH);
    if (workspaceStore.has(k.PRIVATE_KEY)) config.sshPrivateKey = this.toTemplate(k.PRIVATE_KEY);
    if (workspaceStore.has(k.PUBLIC_KEY)) config.sshPublicKey = this.toTemplate(k.PUBLIC_KEY);
    if (workspaceStore.has(k.KEY_TYPE)) config.keyType = this.toTemplate(k.KEY_TYPE);

    return Object.keys(config).length ? config : null;
  }

  async getGitLabTemplateConfig(workspaceId: string): Promise<Partial<GitLabEnvConfig> | null> {
    await this.ensureInitialized();
    const workspaceStore = this.store.get(workspaceId);
    if (!workspaceStore) return null;

    const k = GIT_ENV_KEYS.GITLAB;
    const config: Partial<GitLabEnvConfig> = {};

    if (workspaceStore.has(k.URL)) config.gitlabUrl = this.toTemplate(k.URL);
    if (workspaceStore.has(k.BRANCH)) config.gitlabBranch = this.toTemplate(k.BRANCH);
    if (workspaceStore.has(k.PROJECT_ID)) config.gitlabProjectId = this.toTemplate(k.PROJECT_ID);
    if (workspaceStore.has(k.PROJECT_ACCESS_TOKEN))
      config.gitlabProjectAccessToken = this.toTemplate(k.PROJECT_ACCESS_TOKEN);
    if (workspaceStore.has(k.ENTERPRISE_URL)) config.gitlabEnterpriseUrl = this.toTemplate(k.ENTERPRISE_URL);

    return Object.keys(config).length ? config : null;
  }

  setProviderState(workspaceId: string, provider: GITConnectionType, state: EnvProviderState): void {
    const existing = this.providerStateStore.get(workspaceId) ?? new Map<GITConnectionType, EnvProviderState>();
    existing.set(provider, state);
    this.providerStateStore.set(workspaceId, existing);
  }

  getProviderState(workspaceId: string, provider: GITConnectionType): EnvProviderState {
    return this.providerStateStore.get(workspaceId)?.get(provider) ?? { isEnabled: false, isFinalized: false };
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
    this.logger.log('Scanning for workspace env files...');
    const nextStore: Map<string, Map<string, string>> = new Map();
    const nextProviderStateStore: Map<string, Map<GITConnectionType, EnvProviderState>> = new Map();

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

      const workspaceProviderState = new Map<GITConnectionType, EnvProviderState>();
      const providerSummary: Record<GITConnectionType, ProviderSummary> = {
        [GITConnectionType.GITHUB_HTTPS]: {
          mapped: Object.values(GIT_ENV_KEYS.HTTPS).some((key) => encryptedMap.has(key)),
          ready: REQUIRED_KEYS.HTTPS.every((key) => encryptedMap.has(key)),
        },
        [GITConnectionType.GITLAB]: {
          mapped: Object.values(GIT_ENV_KEYS.GITLAB).some((key) => encryptedMap.has(key)),
          ready: REQUIRED_KEYS.GITLAB.every((key) => encryptedMap.has(key)),
        },
        [GITConnectionType.GITHUB_SSH]: {
          mapped: Object.values(GIT_ENV_KEYS.SSH).some((key) => encryptedMap.has(key)),
          ready: REQUIRED_KEYS.SSH.every((key) => encryptedMap.has(key)),
        },
        [GITConnectionType.DISABLED]: {
          mapped: false,
          ready: false,
        },
      };

      // On startup, enable provider if any env values are mapped
      // isFinalized will be set to true only after successful test connection
      if (providerSummary[GITConnectionType.GITHUB_HTTPS].mapped) {
        workspaceProviderState.set(GITConnectionType.GITHUB_HTTPS, { isEnabled: true, isFinalized: false });
      }
      if (providerSummary[GITConnectionType.GITLAB].mapped) {
        workspaceProviderState.set(GITConnectionType.GITLAB, { isEnabled: true, isFinalized: false });
      }
      if (providerSummary[GITConnectionType.GITHUB_SSH].mapped) {
        workspaceProviderState.set(GITConnectionType.GITHUB_SSH, { isEnabled: true, isFinalized: false });
      }

      if (workspaceProviderState.size > 0) {
        nextProviderStateStore.set(workspaceId, workspaceProviderState);

        // Determine primary provider based on precedence: HTTPS > GitLab > SSH
        const primaryProvider = this.determinePrimaryProvider(providerSummary);

        // Create or update OrganizationGitSync with env config enabled
        await this.updateOrCreateOrgGitSyncFromEnv(workspaceId, primaryProvider);
      }

      this.logger.debug(
        `Loaded ${encryptedMap.size} keys for workspaceId=${workspaceId} from ${fileName}: [${[...encryptedMap.keys()].join(', ')}]`
      );
    }

    // Atomic swap — ongoing reads against the old store are unaffected mid-scan
    this.store = nextStore;
    this.providerStateStore = nextProviderStateStore;
    this.logger.log(`Workspace env registry loaded: ${this.store.size} workspace(s)`);
  }

  private toTemplate(key: string): string {
    return `{{${key}}}`;
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

  /**
   * Determine the primary provider based on precedence: HTTPS > GitLab > SSH
   */
  private determinePrimaryProvider(providerSummary: Record<GITConnectionType, ProviderSummary>): GITConnectionType {
    if (providerSummary[GITConnectionType.GITHUB_HTTPS].mapped) {
      return GITConnectionType.GITHUB_HTTPS;
    }
    if (providerSummary[GITConnectionType.GITLAB].mapped) {
      return GITConnectionType.GITLAB;
    }
    if (providerSummary[GITConnectionType.GITHUB_SSH].mapped) {
      return GITConnectionType.GITHUB_SSH;
    }
    return GITConnectionType.DISABLED;
  }

  /**
   * Create or update OrganizationGitSync record with env config enabled
   */
  private async updateOrCreateOrgGitSyncFromEnv(
    workspaceId: string,
    primaryProvider: GITConnectionType
  ): Promise<void> {
    try {
      const existingOrgGitSync = await this.organizationGitSyncRepository.findOrgGitByOrganizationId(workspaceId);

      if (existingOrgGitSync) {
        // Update existing record: always re-enable useEnvConfig and set provider based on available mappings
        await this.organizationGitSyncRepository.update(
          { organizationId: workspaceId },
          {
            useEnvConfig: true,
            envGitProvider: primaryProvider,
          }
        );
        this.logger.debug(
          `Updated OrganizationGitSync for workspaceId=${workspaceId}: useEnvConfig=true, envGitProvider=${primaryProvider}`
        );
      } else {
        // Create new record with env config enabled
        const newOrgGitSync = this.organizationGitSyncRepository.create({
          organizationId: workspaceId,
          useEnvConfig: true,
          envGitProvider: primaryProvider,
          autoCommit: false,
          isBranchingEnabled: true,
          schemaVersion: '1.0.0',
        });
        await this.organizationGitSyncRepository.save(newOrgGitSync);
        this.logger.debug(
          `Created OrganizationGitSync for workspaceId=${workspaceId}: useEnvConfig=true, envGitProvider=${primaryProvider}`
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to update/create OrganizationGitSync for workspaceId=${workspaceId}: ${errorMessage}`);
    }
  }
}
