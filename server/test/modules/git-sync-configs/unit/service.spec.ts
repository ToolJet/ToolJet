/** @group gitsync */
// Write paths (updateOrgGit, updateBranchingEnabled, updateOrgGitStatus, deleteConfig) call
// dbTransactionWrap with no manager, which opens a real DB transaction outside a unit test's
// reach — stub it to just invoke the callback, matching the existing pattern in
// test/modules/platform-git-sync/unit/push-path-resolution.spec.ts.
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any, manager?: any) => operation(manager ?? {})),
}));

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
import { GitSyncConfigsService } from '@ee/git-sync-configs/service';
import { OrganizationEnvRegistryService } from '@ee/organization-env/service';
import { GitSyncEnvUtilService } from '@ee/organization-env/services/gitsync.util.service';
import { GITConnectionType } from '@entities/organization_git_sync.entity';
import { LICENSE_FIELD } from '@modules/licensing/constants';

// End-to-end regression coverage for the bug this file guards against: an env-config workspace's
// GET /git-sync/:id response used to always come back with git_https/git_type/env_git_provider as
// null, indistinguishable from a broken config — because getOrgGitByOrgId never asked the env
// registry for a templated view of the mapped config (it does now). Runs through the REAL
// OrganizationEnvRegistryService + GitSyncEnvUtilService (backed by a mocked `.tj_env.<slug>` file)
// rather than stubbing them, so a regression in either the mapping/read flow or this synthesis step
// would fail here.
const WORKSPACE_ID = '33333333-3333-3333-3333-333333333333';
const WORKSPACE_SLUG = 'test-tj-env-workspace';

const HTTPS_CONFIG = {
  GITHUB_URL: 'https://github.com/tooljet/tj-env-file-test.git',
  GITHUB_BRANCH: 'main',
  GITHUB_APP_ID: '111000',
  GITHUB_INSTALLATION_ID: '222000',
  GITHUB_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\ntest-key-content\n-----END RSA PRIVATE KEY-----',
};

function tjEnvFileContents(config: Record<string, string>): string {
  return Object.entries(config)
    .map(([k, v]) => `${k}="${v}"`)
    .join('\n');
}

function makeService(orgGit: any) {
  const orgRepo = {
    findOne: jest.fn().mockImplementation(({ where }: any) => {
      if (where?.slug === WORKSPACE_SLUG) return Promise.resolve({ id: WORKSPACE_ID, slug: WORKSPACE_SLUG });
      if (where?.id === WORKSPACE_ID) return Promise.resolve({ id: WORKSPACE_ID, slug: WORKSPACE_SLUG });
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

  const repository = { findOrgGitByOrganizationId: jest.fn().mockResolvedValue(orgGit) };
  const gitSyncLicenseTerms = {
    getLicenseTerms: jest
      .fn()
      .mockResolvedValue({ [LICENSE_FIELD.GIT_SYNC]: true, [LICENSE_FIELD.GIT_SYNC_MULTI_BRANCH]: true }),
  };

  const service = new GitSyncConfigsService(
    repository as any,
    gitSyncLicenseTerms as any,
    gitSyncEnvUtilService,
    {} as any,
    {} as any
  );

  return { service, registry, gitSyncEnvUtilService };
}

describe('GitSyncConfigsService.getOrgGitByOrgId', () => {
  beforeEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.readdir as jest.Mock).mockResolvedValue([`.tj_env.${WORKSPACE_SLUG}`]);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(tjEnvFileContents(HTTPS_CONFIG));
  });

  afterEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
    jest.clearAllMocks();
  });

  it('throws when the caller is not in the target organization', async () => {
    const { service } = makeService({ organizationId: WORKSPACE_ID, useEnvConfig: false });
    await expect(service.getOrgGitByOrgId('someone-else', WORKSPACE_ID)).rejects.toThrow();
  });

  it('returns organization_git: null when no config row exists yet', async () => {
    const { service } = makeService(null);
    const result = await service.getOrgGitByOrgId(WORKSPACE_ID, WORKSPACE_ID);
    expect(result).toEqual({ organization_git: null });
  });

  it('synthesizes a templated git_https view for an env-config workspace with a complete config', async () => {
    const orgGit = {
      id: 'org-git-id',
      organizationId: WORKSPACE_ID,
      useEnvConfig: true,
      envGitProvider: null, // never persisted for env-config orgs — must be derived, not read raw
      isBranchingEnabled: true,
      gitHttps: null, // env-config orgs keep no DB row for the active provider
      gitLab: null,
    };
    const { service, registry } = makeService(orgGit);
    await registry.initialize();

    const result = await service.getOrgGitByOrgId(WORKSPACE_ID, WORKSPACE_ID);

    expect(result.organization_git.use_env_config).toBe(true);
    expect(result.organization_git.git_type).toBe(GITConnectionType.GITHUB_HTTPS);
    expect(result.organization_git.env_git_provider).toBe(GITConnectionType.GITHUB_HTTPS);
    expect(result.organization_git.git_lab).toBeNull();
    expect(result.organization_git.git_https).toEqual(
      expect.objectContaining({
        https_url: '{{GITHUB_URL}}',
        github_branch: '{{GITHUB_BRANCH}}',
        github_app_id: '{{GITHUB_APP_ID}}',
        github_installation_id: '{{GITHUB_INSTALLATION_ID}}',
        github_private_key: '{{GITHUB_PRIVATE_KEY}}',
      })
    );
    // No secret value ever reaches the response.
    expect(JSON.stringify(result)).not.toContain(HTTPS_CONFIG.GITHUB_PRIVATE_KEY);
  });

  it('surfaces a partial templated view (not null) when the mapped config is incomplete', async () => {
    // A workspace flagged useEnvConfig=true whose env keys don't form a complete required set —
    // the template getter still returns whatever IS mapped (for admin debuggability), so the
    // response must reflect that partial shape rather than collapsing to null or crashing.
    (fs.promises.readFile as jest.Mock).mockResolvedValue(`GITHUB_BRANCH="main"`);
    const orgGit = {
      id: 'org-git-id',
      organizationId: WORKSPACE_ID,
      useEnvConfig: true,
      envGitProvider: null,
      isBranchingEnabled: true,
      gitHttps: null,
      gitLab: null,
    };
    const { service, registry } = makeService(orgGit);
    await registry.initialize();

    const result = await service.getOrgGitByOrgId(WORKSPACE_ID, WORKSPACE_ID);

    expect(result.organization_git.git_type).toBe(GITConnectionType.GITHUB_HTTPS);
    expect(result.organization_git.git_lab).toBeNull();
    expect(result.organization_git.git_https).toEqual({
      github_branch: '{{GITHUB_BRANCH}}',
      is_enabled: true,
      is_finalized: false,
    });
  });

  it('returns null config/type when the workspace has no mapped env keys at all', async () => {
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    const orgGit = {
      id: 'org-git-id',
      organizationId: WORKSPACE_ID,
      useEnvConfig: true,
      envGitProvider: null,
      isBranchingEnabled: true,
      gitHttps: null,
      gitLab: null,
    };
    const { service, registry } = makeService(orgGit);
    await registry.initialize();

    const result = await service.getOrgGitByOrgId(WORKSPACE_ID, WORKSPACE_ID);

    expect(result.organization_git.git_https).toBeNull();
    expect(result.organization_git.git_lab).toBeNull();
    expect(result.organization_git.git_type).toBeNull();
    expect(result.organization_git.env_git_provider).toBeNull();
  });

  it('leaves the plain DB-backed (non-env-config) flow unchanged', async () => {
    const orgGit = {
      id: 'org-git-id',
      organizationId: WORKSPACE_ID,
      useEnvConfig: false,
      isBranchingEnabled: true,
      gitHttps: { isEnabled: true, httpsUrl: 'https://github.com/org/repo.git', githubPrivateKey: 'secret' },
      gitLab: null,
    };
    const { service } = makeService(orgGit);

    const result = await service.getOrgGitByOrgId(WORKSPACE_ID, WORKSPACE_ID);

    expect(result.organization_git.git_type).toBe(GITConnectionType.GITHUB_HTTPS);
    expect(result.organization_git.git_https.https_url).toBe('https://github.com/org/repo.git');
    // Secret field is stripped, same as before this change.
    expect(result.organization_git.git_https.github_private_key).toBeUndefined();
  });
});

// Regression coverage: getOrgGitStatusById (the only endpoint builders can reach —
// getOrgGitByOrgId is admin-only) never populates envGitProvider/gitHttps/gitLab for an
// env-config org, so resolveGitType() used to see nothing and wrongly throw "No Git Provider
// is enabled for the workspace" for every env-configured workspace, admin or builder.
describe('GitSyncConfigsService.getOrgGitStatusById — env config', () => {
  beforeEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.readdir as jest.Mock).mockResolvedValue([`.tj_env.${WORKSPACE_SLUG}`]);
    (fs.promises.readFile as jest.Mock).mockResolvedValue(tjEnvFileContents(HTTPS_CONFIG));
  });

  afterEach(() => {
    delete process.env.WORKSPACE_GIT_CONFIGS;
    jest.clearAllMocks();
  });

  it('resolves gitType from the env registry instead of throwing "No Git Provider is enabled"', async () => {
    const orgGit = {
      id: 'org-git-id',
      organizationId: WORKSPACE_ID,
      useEnvConfig: true,
      envGitProvider: null, // never persisted for env-config orgs
      isBranchingEnabled: true,
      gitHttps: null, // env-config orgs keep no DB row for the active provider
      gitLab: null,
    };
    const { service, registry } = makeService(orgGit);
    await registry.initialize();

    const result = await service.getOrgGitStatusById(WORKSPACE_ID, WORKSPACE_ID);

    expect(result.git_type).toBe(GITConnectionType.GITHUB_HTTPS);
    expect(result.is_git_sync_configured).toBe(true);
    expect(result.repo_url).toBe(HTTPS_CONFIG.GITHUB_URL);
    expect(result.default_git_branch).toBe(HTTPS_CONFIG.GITHUB_BRANCH);
  });

  // Regression coverage for the actual bug report: a workspace configured via the UI first (leaving
  // a real gitHttps row in the DB), then switched to env-var config, correctly shows the env repo on
  // the config page (getOrgGitByOrgId) but getOrgGitStatusById — which feeds the "Connected to repo"
  // label plus the "View in Git Repo"/"Create PR" links in the pull/push modal — used to read
  // orgGit.gitHttps directly and report the stale, never-deleted UI-configured repo instead.
  it('reports the env repo, not the stale UI-configured repo, once switched to env config', async () => {
    const orgGit = {
      id: 'org-git-id',
      organizationId: WORKSPACE_ID,
      useEnvConfig: true,
      envGitProvider: null,
      isBranchingEnabled: true,
      // Leftover row from when this workspace was configured through the UI — superseded by env
      // config, never deleted. If the fix regresses, this is the URL getOrgGitStatusById returns.
      gitHttps: {
        isEnabled: true,
        isFinalized: true,
        httpsUrl: 'https://github.com/old-org/ui-configured-repo.git',
        githubBranch: 'ui-branch',
      },
      gitLab: null,
    };
    const { service, registry } = makeService(orgGit);
    await registry.initialize();

    const result = await service.getOrgGitStatusById(WORKSPACE_ID, WORKSPACE_ID);

    expect(result.repo_url).toBe(HTTPS_CONFIG.GITHUB_URL);
    expect(result.default_git_branch).toBe(HTTPS_CONFIG.GITHUB_BRANCH);
    expect(result.repo_url).not.toBe('https://github.com/old-org/ui-configured-repo.git');
  });
});

// Regression coverage: the phase-2 split introduced a raw `repository.findOrgGitByOrganizationId`
// read in every public method here, bypassing GitSyncEnvUtilService.ensureResolved entirely. Since
// ensureResolved is what flips useEnvConfig=true on first touch for a workspace with a valid
// `.tj_env.<slug>` / WORKSPACE_GIT_CONFIGS mapping, skipping it meant these endpoints could only ever
// see a stale (never-hydrated) row — the workspace looked unconfigured until some unrelated legacy
// code path happened to resolve it first. Every read in this class must go through the private
// findOrgGit() helper, which calls ensureResolved before the repository read.
describe('GitSyncConfigsService — resolves env config before every read', () => {
  function makeServiceWithFullRepo(orgGit: any) {
    const gitSyncEnvUtilService = {
      ensureResolved: jest.fn().mockResolvedValue(undefined),
      getActiveProvider: jest.fn().mockReturnValue(GITConnectionType.GITHUB_HTTPS),
      getProviderState: jest.fn().mockReturnValue({ isEnabled: true, isFinalized: true }),
      setProviderState: jest.fn(),
      getGitHttpsTemplateConfig: jest.fn().mockResolvedValue(null),
      getGitLabTemplateConfig: jest.fn().mockResolvedValue(null),
    };
    const repository = {
      findOrgGitByOrganizationId: jest.fn().mockResolvedValue(orgGit),
      findOrgGitById: jest.fn().mockResolvedValue(orgGit),
      updateOrgGitConfig: jest.fn().mockResolvedValue(undefined),
      updateProviderEnabled: jest.fn().mockResolvedValue(undefined),
      deleteProviderConfig: jest.fn().mockResolvedValue(undefined),
      updateAutoCommit: jest.fn().mockResolvedValue(undefined),
    };
    const licenseTermsService = {
      getLicenseTerms: jest
        .fn()
        .mockResolvedValue({ [LICENSE_FIELD.GIT_SYNC]: true, [LICENSE_FIELD.GIT_SYNC_MULTI_BRANCH]: true }),
    };
    const remoteBranchCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
    const gitObjectCache = { evictEverywhere: jest.fn().mockResolvedValue(undefined) };

    const service = new GitSyncConfigsService(
      repository as any,
      licenseTermsService as any,
      gitSyncEnvUtilService as any,
      remoteBranchCache as any,
      gitObjectCache as any
    );
    return { service, repository, gitSyncEnvUtilService };
  }

  const orgGit = {
    id: 'org-git-id',
    organizationId: WORKSPACE_ID,
    useEnvConfig: false,
    autoCommit: true,
    schemaVersion: '2.0.0',
    isBranchingEnabled: true,
    gitHttps: { isEnabled: true, httpsUrl: 'https://github.com/org/repo.git' },
    gitLab: null,
  };

  it('getOrgGitByOrgId resolves before reading', async () => {
    const { service, gitSyncEnvUtilService } = makeServiceWithFullRepo(orgGit);
    await service.getOrgGitByOrgId(WORKSPACE_ID, WORKSPACE_ID);
    expect(gitSyncEnvUtilService.ensureResolved).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('getOrgGitStatusById resolves before reading', async () => {
    const { service, gitSyncEnvUtilService } = makeServiceWithFullRepo(orgGit);
    await service.getOrgGitStatusById(WORKSPACE_ID, WORKSPACE_ID);
    expect(gitSyncEnvUtilService.ensureResolved).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('updateOrgGit resolves before reading', async () => {
    const { service, gitSyncEnvUtilService } = makeServiceWithFullRepo(orgGit);
    await service.updateOrgGit(WORKSPACE_ID, 'org-git-id', { autoCommit: true } as any, 'github_https');
    expect(gitSyncEnvUtilService.ensureResolved).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('updateBranchingEnabled resolves before reading', async () => {
    const { service, gitSyncEnvUtilService } = makeServiceWithFullRepo(orgGit);
    await service.updateBranchingEnabled(WORKSPACE_ID, 'org-git-id', true);
    expect(gitSyncEnvUtilService.ensureResolved).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('updateOrgGitStatus resolves before reading', async () => {
    const { service, gitSyncEnvUtilService } = makeServiceWithFullRepo(orgGit);
    await service.updateOrgGitStatus(WORKSPACE_ID, 'org-git-id', {
      gitType: GITConnectionType.GITHUB_HTTPS,
      isEnabled: true,
    } as any);
    expect(gitSyncEnvUtilService.ensureResolved).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it('deleteConfig resolves before reading', async () => {
    const { service, gitSyncEnvUtilService } = makeServiceWithFullRepo(orgGit);
    await service.deleteConfig(WORKSPACE_ID, 'org-git-id', 'github_https');
    expect(gitSyncEnvUtilService.ensureResolved).toHaveBeenCalledWith(WORKSPACE_ID);
  });
});
