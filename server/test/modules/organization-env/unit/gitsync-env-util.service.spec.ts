jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn().mockReturnValue(true),
    promises: {
      ...actual.promises,
      readdir: jest.fn(),
      readFile: jest.fn(),
    },
  };
});

import * as fs from 'fs';
import { OrganizationEnvRegistryService } from '@ee/organization-env/service';
import { GitSyncEnvUtilService } from '@ee/organization-env/services/gitsync.util.service';
import { GITConnectionType } from 'src/entities/organization_git_sync.entity';

// Covers both supported ways to map a git provider config onto a workspace without touching
// the DB config form: a `.tj_env.<slug>` file scanned from disk, and the WORKSPACE_GIT_CONFIGS
// env var (a JSON blob keyed by workspace slug/UUID) — mirroring a real .env entry like:
//   WORKSPACE_GIT_CONFIGS='{"devgitsync":{"GITHUB_URL":"...","GITHUB_BRANCH":"main", ...}}'
// Both workspaces below carry a COMPLETE, valid HTTPS config and are exercised through the same
// read-flow: registry load -> slug resolution -> GitSyncEnvUtilService reads.
const FILE_WORKSPACE_SLUG = 'test-tj-env-workspace';
const FILE_WORKSPACE_ID = '11111111-1111-1111-1111-111111111111';
const ENV_VAR_WORKSPACE_SLUG = 'test-workspace-git-configs';
const ENV_VAR_WORKSPACE_ID = '22222222-2222-2222-2222-222222222222';

// Read-flow correctness (key presence, mapping, templating) doesn't depend on the private key
// being cryptographically valid — that's only exercised by the connection-test flow — so a
// realistically-shaped multi-line placeholder is enough here.
const TEST_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\ntest-key-content\n-----END RSA PRIVATE KEY-----';

const FILE_CONFIG = {
  GITHUB_URL: 'https://github.com/tooljet/tj-env-file-test.git',
  GITHUB_BRANCH: 'main',
  GITHUB_APP_ID: '111000',
  GITHUB_INSTALLATION_ID: '222000',
  GITHUB_PRIVATE_KEY: TEST_PRIVATE_KEY,
};

const ENV_VAR_CONFIG = {
  GITHUB_URL: 'https://github.com/tooljet/workspace-git-configs-test.git',
  GITHUB_BRANCH: 'main',
  GITHUB_APP_ID: '333000',
  GITHUB_INSTALLATION_ID: '444000',
  GITHUB_PRIVATE_KEY: TEST_PRIVATE_KEY,
};

function tjEnvFileContents(config: Record<string, string>): string {
  return Object.entries(config)
    .map(([k, v]) => `${k}="${v}"`)
    .join('\n');
}

function makeServices() {
  const orgRepo = {
    findOne: jest.fn().mockImplementation(({ where }: any) => {
      if (where?.slug === FILE_WORKSPACE_SLUG) return Promise.resolve({ id: FILE_WORKSPACE_ID, slug: where.slug });
      if (where?.slug === ENV_VAR_WORKSPACE_SLUG)
        return Promise.resolve({ id: ENV_VAR_WORKSPACE_ID, slug: where.slug });
      if (where?.id === FILE_WORKSPACE_ID) return Promise.resolve({ id: FILE_WORKSPACE_ID, slug: FILE_WORKSPACE_SLUG });
      if (where?.id === ENV_VAR_WORKSPACE_ID)
        return Promise.resolve({ id: ENV_VAR_WORKSPACE_ID, slug: ENV_VAR_WORKSPACE_SLUG });
      return Promise.resolve(null);
    }),
  };
  const registryLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  const registry = new OrganizationEnvRegistryService(orgRepo as any, registryLogger as any);

  const orgGitSyncRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOrgGitByOrganizationId: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockImplementation((v) => v),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const gitSyncLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  const licenseTerms = { getLicenseTerms: jest.fn().mockResolvedValue(true) };
  const gitSyncEnvUtilService = new GitSyncEnvUtilService(
    registry as any,
    orgGitSyncRepo as any,
    gitSyncLogger as any,
    licenseTerms as any
  );

  return { registry, gitSyncEnvUtilService, orgGitSyncRepo, licenseTerms };
}

describe('Git-sync env config mapping + read flow (.tj_env.<slug> file + WORKSPACE_GIT_CONFIGS env var)', () => {
  beforeEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.readdir as jest.Mock).mockResolvedValue([`.tj_env.${FILE_WORKSPACE_SLUG}`]);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(tjEnvFileContents(FILE_CONFIG));
    process.env.WORKSPACE_GIT_CONFIGS = JSON.stringify({ [ENV_VAR_WORKSPACE_SLUG]: ENV_VAR_CONFIG });
  });

  afterEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
    jest.clearAllMocks();
  });

  it('resolves both slug-keyed sources to their org UUIDs on boot', async () => {
    const { registry } = makeServices();
    await registry.initialize();

    expect(await registry.get(FILE_WORKSPACE_ID, 'GITHUB_URL')).toBe(FILE_CONFIG.GITHUB_URL);
    expect(await registry.get(ENV_VAR_WORKSPACE_ID, 'GITHUB_URL')).toBe(ENV_VAR_CONFIG.GITHUB_URL);
    // Neither source should still be sitting under its slug once resolution has run.
    expect(await registry.get(FILE_WORKSPACE_SLUG, 'GITHUB_URL')).toBeUndefined();
    expect(await registry.get(ENV_VAR_WORKSPACE_SLUG, 'GITHUB_URL')).toBeUndefined();
    expect(registry.getResolvedOrganizationIds().sort()).toEqual([FILE_WORKSPACE_ID, ENV_VAR_WORKSPACE_ID].sort());
  });

  describe.each([
    ['.tj_env.<slug> file', FILE_WORKSPACE_ID, FILE_CONFIG],
    ['WORKSPACE_GIT_CONFIGS env var', ENV_VAR_WORKSPACE_ID, ENV_VAR_CONFIG],
  ])('read flow via %s', (_label, orgId, config) => {
    it('reports the HTTPS provider as configured and enabled', async () => {
      const { registry, gitSyncEnvUtilService } = makeServices();
      await registry.initialize();
      await gitSyncEnvUtilService.ensureResolved(orgId);

      expect(gitSyncEnvUtilService.hasGitHttpsConfig(orgId)).toBe(true);
      expect(gitSyncEnvUtilService.hasGitLabConfig(orgId)).toBe(false);
      expect(gitSyncEnvUtilService.getActiveProvider(orgId)).toBe(GITConnectionType.GITHUB_HTTPS);
      expect(gitSyncEnvUtilService.getProviderState(orgId, GITConnectionType.GITHUB_HTTPS)).toEqual({
        isEnabled: true,
        isFinalized: false,
      });
    });

    it('resolves the full config used for actual git operations', async () => {
      const { registry, gitSyncEnvUtilService } = makeServices();
      await registry.initialize();

      const resolved = await gitSyncEnvUtilService.getGitHttpsConfig(orgId);
      expect(resolved).toEqual({
        httpsUrl: config.GITHUB_URL,
        githubBranch: config.GITHUB_BRANCH,
        githubAppId: config.GITHUB_APP_ID,
        githubInstallationId: config.GITHUB_INSTALLATION_ID,
        githubPrivateKey: config.GITHUB_PRIVATE_KEY,
      });
    });

    it('resolves a templated, secret-free config for the settings-page view', async () => {
      const { registry, gitSyncEnvUtilService } = makeServices();
      await registry.initialize();

      const template = await gitSyncEnvUtilService.getGitHttpsTemplateConfig(orgId);
      expect(template).toEqual({
        httpsUrl: '{{GITHUB_URL}}',
        githubBranch: '{{GITHUB_BRANCH}}',
        githubAppId: '{{GITHUB_APP_ID}}',
        githubInstallationId: '{{GITHUB_INSTALLATION_ID}}',
        githubPrivateKey: '{{GITHUB_PRIVATE_KEY}}',
      });
      expect(JSON.stringify(template)).not.toContain(config.GITHUB_PRIVATE_KEY);
    });

    it('persists useEnvConfig=true on the org_git_sync row once resolution runs', async () => {
      const { registry, gitSyncEnvUtilService, orgGitSyncRepo } = makeServices();
      await registry.initialize();

      await gitSyncEnvUtilService.ensureResolved(orgId);

      expect(orgGitSyncRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: orgId, useEnvConfig: true })
      );
    });
  });

  it('keeps the two workspaces fully isolated — one config never leaks into the other', async () => {
    const { registry, gitSyncEnvUtilService } = makeServices();
    await registry.initialize();

    const fileConfig = await gitSyncEnvUtilService.getGitHttpsConfig(FILE_WORKSPACE_ID);
    const envVarConfig = await gitSyncEnvUtilService.getGitHttpsConfig(ENV_VAR_WORKSPACE_ID);

    expect(fileConfig?.httpsUrl).toBe(FILE_CONFIG.GITHUB_URL);
    expect(envVarConfig?.httpsUrl).toBe(ENV_VAR_CONFIG.GITHUB_URL);
    expect(fileConfig?.httpsUrl).not.toBe(envVarConfig?.httpsUrl);
  });

  it('does not mark a workspace as configured when its required keys are incomplete', async () => {
    // A workspace with only a partial config (this is the actual bug scenario: the raw
    // key-presence check must not be mistaken for "fully configured").
    (fs.promises.readdir as jest.Mock).mockResolvedValue([`.tj_env.${FILE_WORKSPACE_SLUG}`]);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(`GITHUB_BRANCH="main"`);
    delete process.env.WORKSPACE_GIT_CONFIGS;

    const { registry, gitSyncEnvUtilService } = makeServices();
    await registry.initialize();

    expect(gitSyncEnvUtilService.hasGitHttpsConfig(FILE_WORKSPACE_ID)).toBe(false);
    expect(await gitSyncEnvUtilService.getGitHttpsConfig(FILE_WORKSPACE_ID)).toBeNull();
  });
});
