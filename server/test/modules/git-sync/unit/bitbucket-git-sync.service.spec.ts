/**
 * BitbucketGitSyncService — the workspace-level provider: git transport resolution, entity-tag
 * listing, and the connection / env-config state transitions. The utility service (Bitbucket REST
 * calls, config resolution) is a fake here; its HTTP behavior is pinned in bitbucket-util.service.spec.ts.
 *
 * @group gitsync
 */
jest.mock('got', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
jest.mock('@ee/git-sync/git-sync-adapter', () => ({ GitSyncAdapter: class {} }));
jest.mock('@ee/import-export-resources/service', () => ({ ImportExportResourcesService: class {} }));
// saveProviderConfig opens its own transaction (no manager passed) — route it to a fake manager.
const mockTxManager = { update: jest.fn() };
jest.mock('@helpers/database.helper', () => ({
  ...jest.requireActual('@helpers/database.helper'),
  dbTransactionWrap: jest.fn((operation: (m: unknown) => unknown, manager?: unknown) =>
    operation(manager ?? mockTxManager)
  ),
}));

import { BitbucketGitSyncService } from '@ee/git-sync/providers/bitbucket/service';
import { GITConnectionType, OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { BitbucketTestConnectionDTO } from '@ee/git-sync/providers/dto/test-provider-connection.dto';

const ORG = 'org-1';
const orgGit = { id: 'orggit-1', organizationId: ORG, useEnvConfig: false } as OrganizationGitSync;
const OK = { connectionStatus: true, connectionMessage: 'Successfully Connected', errCode: 0 };
const FAIL = { connectionStatus: false, connectionMessage: 'Bitbucket authentication failed.', errCode: -20 };

const buildService = () => {
  const svc: unknown = Object.create(BitbucketGitSyncService.prototype);
  const stubs = {
    bitbucketUtilityService: {
      findOrgGitByOrganizationId: jest.fn().mockResolvedValue(orgGit),
      resolveBitbucketConfigs: jest.fn().mockResolvedValue({
        bitbucketWorkspace: 'acme',
        bitbucketRepoSlug: 'web-app',
        bitbucketBranch: 'main',
        bitbucketAccessToken: 'bb-token',
      }),
      listTags: jest.fn().mockResolvedValue([]),
      testGitConnection: jest.fn().mockResolvedValue(OK),
      testGitConnectionWithPayload: jest.fn().mockResolvedValue(OK),
      createBitbucketConfig: jest.fn().mockResolvedValue(undefined),
      seedWorkspaceBranches: jest.fn().mockResolvedValue(undefined),
    },
    organizationEnvRegistryService: { setProviderState: jest.fn() },
    setFinalizeConfig: jest.fn().mockResolvedValue(orgGit),
  };
  // The stubbed collaborators are private on the real class; expose them to the test.
  return Object.assign(svc as object, stubs) as Omit<BitbucketGitSyncService, keyof typeof stubs> & typeof stubs;
};

describe('BitbucketGitSyncService', () => {
  let svc: ReturnType<typeof buildService>;

  beforeEach(() => {
    svc = buildService();
  });

  describe('resolveWorkspaceTransport', () => {
    it('returns a Bitbucket Cloud clone URL with x-token-auth credentials', async () => {
      await expect(svc.resolveWorkspaceTransport(ORG)).resolves.toEqual({
        cleanRepoUrl: 'https://bitbucket.org/acme/web-app.git',
        token: 'bb-token',
        isEnterprise: false,
        authUsername: 'x-token-auth',
        defaultBranch: 'main',
      });
    });
  });

  describe('listEntityTags', () => {
    it("returns only the entity's tags (co_relation_id prefix), mapped to { name, commit.sha }", async () => {
      svc.bitbucketUtilityService.listTags.mockResolvedValue([
        { name: 'co-1/v1', target: { hash: 'aaa' } },
        { name: 'co-2/v1', target: { hash: 'bbb' } },
        { name: 'co-1/v2' }, // no target → empty sha
      ]);

      await expect(svc.listEntityTags(ORG, 'co-1')).resolves.toEqual([
        { name: 'co-1/v1', commit: { sha: 'aaa' } },
        { name: 'co-1/v2', commit: { sha: '' } },
      ]);
    });

    it('does not call Bitbucket when there is no co_relation_id', async () => {
      await expect(svc.listEntityTags(ORG, '')).resolves.toEqual([]);
      expect(svc.bitbucketUtilityService.listTags).not.toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('returns the connection status when the stored config connects', async () => {
      await expect(svc.testConnection('user-1', ORG)).resolves.toEqual({ connectionStatus: true });
    });

    it('throws with the provider message when the connection fails', async () => {
      svc.bitbucketUtilityService.testGitConnection.mockResolvedValue(FAIL);
      await expect(svc.testConnection('user-1', ORG)).rejects.toThrow(FAIL.connectionMessage);
    });

    it('throws when git sync is not configured for the workspace', async () => {
      svc.bitbucketUtilityService.findOrgGitByOrganizationId.mockResolvedValue(null);
      await expect(svc.testConnection('user-1', ORG)).rejects.toThrow('Organization Git Sync configuration not found.');
    });
  });

  describe('testConnectionWithPayload', () => {
    const payload: BitbucketTestConnectionDTO = {
      gitType: GITConnectionType.BITBUCKET,
      gitUrl: 'https://bitbucket.org/acme/web-app',
      bitbucketWorkspace: 'acme',
      bitbucketRepoSlug: 'web-app',
      bitbucketAccessToken: 'bb-token',
    };

    it('tests the submitted payload directly', async () => {
      await expect(svc.testConnectionWithPayload('user-1', ORG, payload)).resolves.toEqual({ connectionStatus: true });
      expect(svc.bitbucketUtilityService.testGitConnectionWithPayload).toHaveBeenCalledWith(payload);
    });

    it.each([['useEnvConfig'], ['hasStoredConfig']])('falls back to the stored config when %s is set', async (flag) => {
      await svc.testConnectionWithPayload('user-1', ORG, { ...payload, [flag]: true });
      expect(svc.bitbucketUtilityService.testGitConnection).toHaveBeenCalledWith(orgGit);
      expect(svc.bitbucketUtilityService.testGitConnectionWithPayload).not.toHaveBeenCalled();
    });

    it('throws with the provider message when the payload fails to connect', async () => {
      svc.bitbucketUtilityService.testGitConnectionWithPayload.mockResolvedValue(FAIL);
      await expect(svc.testConnectionWithPayload('user-1', ORG, payload)).rejects.toThrow(FAIL.connectionMessage);
    });
  });

  describe('saveProviderConfig', () => {
    it('refuses to save a DB config while env configuration is enabled', async () => {
      svc.bitbucketUtilityService.findOrgGitByOrganizationId.mockResolvedValue({ ...orgGit, useEnvConfig: true });
      await expect(
        svc.saveProviderConfig('user-1', ORG, { gitUrl: 'https://bitbucket.org/acme/web-app' } as never)
      ).rejects.toThrow('Cannot save configuration while environment configuration is enabled.');
      expect(svc.bitbucketUtilityService.seedWorkspaceBranches).not.toHaveBeenCalled();
    });

    const configData = {
      gitType: GITConnectionType.BITBUCKET,
      gitUrl: 'https://bitbucket.org/acme/web-app',
      branchName: 'develop',
      bitbucketWorkspace: 'acme',
      bitbucketRepoSlug: 'web-app',
      bitbucketAccessToken: 'bb-token',
    };

    it('saves the config, finalizes it, then reconciles the default branch to the configured name', async () => {
      await svc.saveProviderConfig('user-1', ORG, configData);

      expect(svc.bitbucketUtilityService.createBitbucketConfig).toHaveBeenCalledWith(
        configData,
        orgGit.id,
        mockTxManager
      );
      expect(svc.setFinalizeConfig).toHaveBeenCalledWith('user-1', ORG, orgGit.id, mockTxManager);
      expect(svc.bitbucketUtilityService.seedWorkspaceBranches).toHaveBeenCalledWith(
        ORG,
        orgGit.id,
        'develop',
        mockTxManager
      );
    });

    it("seeds the default branch as 'main' when no branch name is configured", async () => {
      await svc.saveProviderConfig('user-1', ORG, { ...configData, branchName: '' });
      expect(svc.bitbucketUtilityService.seedWorkspaceBranches).toHaveBeenCalledWith(
        ORG,
        orgGit.id,
        'main',
        mockTxManager
      );
    });

    it('does not seed branches when finalizing (the connection test) fails', async () => {
      svc.setFinalizeConfig.mockRejectedValue(new Error('Bitbucket authentication failed.'));
      await expect(svc.saveProviderConfig('user-1', ORG, configData)).rejects.toThrow(
        'Bitbucket authentication failed.'
      );
      expect(svc.bitbucketUtilityService.seedWorkspaceBranches).not.toHaveBeenCalled();
    });
  });

  describe('finalizeEnvProviderConfig', () => {
    const manager = () => ({ update: jest.fn().mockResolvedValue(undefined) });

    it('marks the bitbucket env provider enabled + finalized when the env config connects', async () => {
      await svc.finalizeEnvProviderConfig(ORG, manager() as never);
      expect(svc.organizationEnvRegistryService.setProviderState).toHaveBeenCalledWith(
        ORG,
        GITConnectionType.BITBUCKET,
        {
          isEnabled: true,
          isFinalized: true,
        }
      );
    });

    it('reconciles the default branch to the env-configured branch name', async () => {
      svc.bitbucketUtilityService.resolveBitbucketConfigs.mockResolvedValue({ bitbucketBranch: 'release' });
      const m = manager();

      await svc.finalizeEnvProviderConfig(ORG, m as never);

      expect(svc.bitbucketUtilityService.seedWorkspaceBranches).toHaveBeenCalledWith(ORG, orgGit.id, 'release', m);
    });

    it("seeds the default branch as 'main' when the env config has no branch", async () => {
      svc.bitbucketUtilityService.resolveBitbucketConfigs.mockResolvedValue({ bitbucketBranch: undefined });
      const m = manager();

      await svc.finalizeEnvProviderConfig(ORG, m as never);

      expect(svc.bitbucketUtilityService.seedWorkspaceBranches).toHaveBeenCalledWith(ORG, orgGit.id, 'main', m);
    });

    it('disables the provider, turns useEnvConfig off and throws when the env config fails to connect', async () => {
      svc.bitbucketUtilityService.testGitConnection.mockResolvedValue(FAIL);
      const m = manager();

      await expect(svc.finalizeEnvProviderConfig(ORG, m as never)).rejects.toThrow(FAIL.connectionMessage);
      expect(svc.organizationEnvRegistryService.setProviderState).toHaveBeenCalledWith(
        ORG,
        GITConnectionType.BITBUCKET,
        {
          isEnabled: false,
          isFinalized: false,
        }
      );
      expect(m.update).toHaveBeenCalledWith(OrganizationGitSync, { organizationId: ORG }, { useEnvConfig: false });
      expect(svc.bitbucketUtilityService.seedWorkspaceBranches).not.toHaveBeenCalled();
    });

    it('throws when git sync is not configured for the workspace', async () => {
      svc.bitbucketUtilityService.findOrgGitByOrganizationId.mockResolvedValue(null);
      await expect(svc.finalizeEnvProviderConfig(ORG, manager() as never)).rejects.toThrow(
        'Organization Git Sync configuration not found.'
      );
    });
  });
});
