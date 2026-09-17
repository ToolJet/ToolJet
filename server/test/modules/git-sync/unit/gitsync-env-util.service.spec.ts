/**
 * GitSyncEnvUtilService (env-var-based git config) — the config-building, provider-state,
 * and template methods. The collaborators (OrganizationEnvRegistryService, the git-sync repo,
 * logger, licenseTermsService) are fakes; provider state is pre-seeded so ensureResolved
 * short-circuits (its DB/hydration path isn't under test here). No Nest app / DB.
 *
 * @group gitsync
 */
import { GitSyncEnvUtilService } from '@ee/organization-env/services/gitsync.util.service';
import { GIT_ENV_KEYS } from '@modules/organization-env/constants';
import { GITConnectionType } from '@entities/organization_git_sync.entity';

const H = GIT_ENV_KEYS.HTTPS;
const GL = GIT_ENV_KEYS.GITLAB;
const ORG = 'org1';

describe('GitSyncEnvUtilService', () => {
  let svc: GitSyncEnvUtilService;
  let orgEnv: { ensureResolved: jest.Mock; has: jest.Mock; hasAll: jest.Mock; get: jest.Mock };
  let license: { getLicenseTerms: jest.Mock };

  // Drive has()/get() off a plain key→value map.
  const withEnv = (env: Record<string, string>) => {
    orgEnv.has.mockImplementation((_org: string, key: string) => key in env);
    orgEnv.hasAll.mockImplementation((_org: string, keys: string[]) => keys.every((k) => k in env));
    orgEnv.get.mockImplementation((_org: string, key: string) => Promise.resolve(env[key]));
  };

  // Pre-seed provider state so ensureResolved returns at its early guard (providerStateStore.has).
  const seedResolved = () => {
    svc.setProviderState(ORG, GITConnectionType.GITHUB_HTTPS, { isEnabled: true, isFinalized: false });
    (svc as any).hydratedOrgs.add(ORG); // hydrateUseEnvConfig fire-and-forget → early return
  };

  beforeEach(() => {
    orgEnv = {
      ensureResolved: jest.fn().mockResolvedValue(undefined),
      has: jest.fn().mockReturnValue(false),
      hasAll: jest.fn().mockReturnValue(false),
      get: jest.fn().mockResolvedValue(undefined),
    };
    license = { getLicenseTerms: jest.fn().mockResolvedValue(true) };
    const repo = new Proxy({}, { get: () => jest.fn().mockResolvedValue(undefined) }) as any;
    const logger = { warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;
    svc = new GitSyncEnvUtilService(orgEnv as any, repo, logger, license as any);
  });

  describe('hasGitHttpsConfig / hasGitLabConfig', () => {
    it('delegate to orgEnvService.hasAll with the required keys', () => {
      orgEnv.hasAll.mockReturnValue(true);
      expect(svc.hasGitHttpsConfig(ORG)).toBe(true);
      expect(svc.hasGitLabConfig(ORG)).toBe(true);
      expect(orgEnv.hasAll).toHaveBeenCalledWith(ORG, expect.arrayContaining([H.URL, H.BRANCH, H.APP_ID]));
      expect(orgEnv.hasAll).toHaveBeenCalledWith(ORG, expect.arrayContaining([GL.URL, GL.BRANCH, GL.PROJECT_ID]));
    });
  });

  describe('getGitHttpsConfig', () => {
    it('returns null when the workspace lacks the env-mapping license (and revokes)', async () => {
      seedResolved();
      license.getLicenseTerms.mockResolvedValue(false);
      await expect(svc.getGitHttpsConfig(ORG)).resolves.toBeNull();
    });

    it('returns null when required HTTPS keys are missing', async () => {
      seedResolved();
      withEnv({}); // hasAll → false
      await expect(svc.getGitHttpsConfig(ORG)).resolves.toBeNull();
    });

    it('builds the config from env values, including optional enterprise urls', async () => {
      seedResolved();
      withEnv({
        [H.URL]: 'https://git/repo',
        [H.BRANCH]: 'main',
        [H.APP_ID]: 'app-1',
        [H.INSTALLATION_ID]: 'inst-1',
        [H.PRIVATE_KEY]: 'KEY',
        [H.ENTERPRISE_URL]: 'https://ghe',
        [H.ENTERPRISE_API_URL]: 'https://ghe/api',
      });
      const cfg = await svc.getGitHttpsConfig(ORG);
      expect(cfg).toEqual({
        httpsUrl: 'https://git/repo',
        githubBranch: 'main',
        githubAppId: 'app-1',
        githubInstallationId: 'inst-1',
        githubPrivateKey: 'KEY',
        githubEnterpriseUrl: 'https://ghe',
        githubEnterpriseApiUrl: 'https://ghe/api',
      });
      // finalized state written
      expect(svc.getProviderState(ORG, GITConnectionType.GITHUB_HTTPS).isFinalized).toBe(true);
    });

    it('omits optional enterprise fields when unset', async () => {
      seedResolved();
      withEnv({ [H.URL]: 'u', [H.BRANCH]: 'main', [H.APP_ID]: 'a', [H.INSTALLATION_ID]: 'i', [H.PRIVATE_KEY]: 'k' });
      const cfg = await svc.getGitHttpsConfig(ORG);
      expect(cfg).not.toHaveProperty('githubEnterpriseUrl');
      expect(cfg).not.toHaveProperty('githubEnterpriseApiUrl');
    });
  });

  describe('getGitLabConfig', () => {
    it('builds the config from env values with optional token + enterprise url', async () => {
      seedResolved();
      withEnv({
        [GL.URL]: 'https://gl/repo',
        [GL.BRANCH]: 'main',
        [GL.PROJECT_ID]: 'grp/proj',
        [GL.PROJECT_ACCESS_TOKEN]: 'glpat',
        [GL.ENTERPRISE_URL]: 'https://gl',
      });
      const cfg = await svc.getGitLabConfig(ORG);
      expect(cfg).toEqual({
        gitlabUrl: 'https://gl/repo',
        gitlabBranch: 'main',
        gitlabProjectId: 'grp/proj',
        gitlabProjectAccessToken: 'glpat',
        gitlabEnterpriseUrl: 'https://gl',
      });
    });

    it('returns null when required GitLab keys are missing', async () => {
      seedResolved();
      withEnv({ [GL.URL]: 'u' }); // no branch/projectId
      await expect(svc.getGitLabConfig(ORG)).resolves.toBeNull();
    });
  });

  describe('template configs', () => {
    it('render {{ENV_KEY}} placeholders for the keys that are present', async () => {
      seedResolved();
      orgEnv.has.mockImplementation((_o: string, key: string) => [H.URL, H.BRANCH].includes(key));
      const tpl = await svc.getGitHttpsTemplateConfig(ORG);
      expect(tpl).toEqual({ httpsUrl: `{{${H.URL}}}`, githubBranch: `{{${H.BRANCH}}}` });
    });

    it('return null when no keys are present', async () => {
      seedResolved();
      orgEnv.has.mockReturnValue(false);
      await expect(svc.getGitLabTemplateConfig(ORG)).resolves.toBeNull();
    });
  });

  describe('provider state + active provider', () => {
    it('setProviderState / getProviderState round-trip the stored state', () => {
      svc.setProviderState(ORG, GITConnectionType.GITLAB, { isEnabled: true, isFinalized: true });
      expect(svc.getProviderState(ORG, GITConnectionType.GITLAB)).toEqual({ isEnabled: true, isFinalized: true });
    });

    it('getProviderState falls back to env-key presence when no state is stored', () => {
      orgEnv.has.mockImplementation((_o: string, key: string) => key === H.URL);
      const state = svc.getProviderState(ORG, GITConnectionType.GITHUB_HTTPS);
      expect(state).toEqual({ isEnabled: true, isFinalized: false });
    });

    it('getActiveProvider prefers an enabled provider (HTTPS priority), else DISABLED', () => {
      expect(svc.getActiveProvider(ORG)).toBe(GITConnectionType.DISABLED);
      svc.setProviderState(ORG, GITConnectionType.GITLAB, { isEnabled: true, isFinalized: false });
      expect(svc.getActiveProvider(ORG)).toBe(GITConnectionType.GITLAB);
      svc.setProviderState(ORG, GITConnectionType.GITHUB_HTTPS, { isEnabled: true, isFinalized: false });
      expect(svc.getActiveProvider(ORG)).toBe(GITConnectionType.GITHUB_HTTPS); // HTTPS wins on priority
    });

    it('getActiveProvider falls back to a stored-but-disabled provider (Tier 2)', () => {
      svc.setProviderState(ORG, GITConnectionType.GITLAB, { isEnabled: false, isFinalized: false });
      expect(svc.getActiveProvider(ORG)).toBe(GITConnectionType.GITLAB);
    });
  });
});
