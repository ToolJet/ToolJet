/**
 * BaseGitUtilService (EE) — the pure + directly-mockable methods:
 *   - validateGitProviderConflict (one-provider-active rule)
 *   - checkVersionCompatibility (import version gate)
 *   - resetDefaultBranchSyncState (disable / repo-url-change bookkeeping reset)
 *   - findMatchingVersion / deleteMatchingVersionIfExists
 *
 * Importing this service drags in the GitSyncAdapter → import/export → `got` (ESM) chain, so
 * those DI-only modules are stubbed. The methods under test use only the deps we fake.
 *
 * @group gitsync
 */
jest.mock('got', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@ee/git-sync/git-sync-adapter', () => ({ GitSyncAdapter: class {} }));
jest.mock('@ee/import-export-resources/service', () => ({ ImportExportResourcesService: class {} }));
jest.mock('@modules/apps/services/app-import-export.service', () => ({
  convertSinglePageSchemaToMultiPageSchema: jest.fn((p) => ({ ...p, __converted: true })),
}));

import { BadRequestException } from '@nestjs/common';
import { BaseGitUtilService } from '@ee/git-sync/base-git-util.service';
import { GITConnectionType } from '@entities/organization_git_sync.entity';

describe('BaseGitUtilService (EE)', () => {
  let versionUtilService: { fetchVersions: jest.Mock; deleteVersionGit: jest.Mock };
  let appVersionRepository: { getAppVersionById: jest.Mock };
  let svc: BaseGitUtilService;

  beforeEach(() => {
    versionUtilService = { fetchVersions: jest.fn(), deleteVersionGit: jest.fn().mockResolvedValue(undefined) };
    appVersionRepository = { getAppVersionById: jest.fn() };
    // Constructor: (importExport, license, appsUtil, orgRepo, adapter, versionUtil, appVersionRepo, logger, envRegistry)
    svc = new BaseGitUtilService(
      null as any,
      null as any,
      null as any,
      null as any,
      null as any,
      versionUtilService as any,
      appVersionRepository as any,
      { log: jest.fn() } as any,
      null as any
    );
  });

  describe('validateGitProviderConflict', () => {
    const call = (config: any, dto: any) => () => svc.validateGitProviderConflict('org', config, dto);

    it('allows when no provider is currently enabled', () => {
      expect(call({}, { gitType: GITConnectionType.GITLAB, isEnabled: true })).not.toThrow();
    });

    it('allows when the enabled provider matches the requested gitType', () => {
      expect(
        call({ gitHttps: { isEnabled: true } }, { gitType: GITConnectionType.GITHUB_HTTPS, isEnabled: true })
      ).not.toThrow();
    });

    it('rejects switching to a different provider while one is active (isEnabled=true)', () => {
      expect(call({ gitHttps: { isEnabled: true } }, { gitType: GITConnectionType.GITLAB, isEnabled: true })).toThrow(
        'Only one Git provider can be active at a time.'
      );
    });

    it('rejects a provider-type mismatch on a disable request (isEnabled=false)', () => {
      expect(
        call({ gitLab: { isEnabled: true } }, { gitType: GITConnectionType.GITHUB_HTTPS, isEnabled: false })
      ).toThrow('Git provider type mismatch');
    });
  });

  describe('checkVersionCompatibility', () => {
    const orig = (globalThis as any).TOOLJET_VERSION;
    beforeAll(() => ((globalThis as any).TOOLJET_VERSION = '2.50.0'));
    afterAll(() => ((globalThis as any).TOOLJET_VERSION = orig));

    it('throws when the app was exported from a newer ToolJet version', () => {
      expect(() => svc.checkVersionCompatibility('3.0.0')).toThrow(BadRequestException);
    });

    it('passes for an equal or older version', () => {
      expect(() => svc.checkVersionCompatibility('2.50.0')).not.toThrow();
      expect(() => svc.checkVersionCompatibility('1.0.0')).not.toThrow();
    });
  });

  describe('resetDefaultBranchSyncState', () => {
    const buildManager = (defaultBranch: any) => {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      return {
        manager: {
          findOne: jest.fn().mockResolvedValue(defaultBranch),
          createQueryBuilder: jest.fn(() => qb),
          update: jest.fn().mockResolvedValue(undefined),
        },
        qb,
      };
    };

    it('is a no-op when the org has no default branch', async () => {
      const { manager, qb } = buildManager(null);
      await (svc as any).resetDefaultBranchSyncState(manager, 'org1');
      expect(qb.execute).not.toHaveBeenCalled();
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('flips is_synced=false on the default branch and clears last_synced_commit', async () => {
      const { manager, qb } = buildManager({ id: 'b-1' });
      await (svc as any).resetDefaultBranchSyncState(manager, 'org1');
      // two UPDATE ... SET isSynced=false (AppVersion + DataSourceVersion)
      expect(qb.set).toHaveBeenCalledWith({ isSynced: false });
      expect(qb.execute).toHaveBeenCalledTimes(2);
      // last_synced_commit cleared on the branch
      expect(manager.update).toHaveBeenCalledWith(expect.anything(), { id: 'b-1' }, { lastSyncedCommit: null });
    });
  });

  describe('findMatchingVersion', () => {
    it('returns the version whose name matches gitVersionName', async () => {
      versionUtilService.fetchVersions.mockResolvedValue([{ name: 'v1' }, { name: 'v2' }]);
      await expect(svc.findMatchingVersion('app1', 'v2')).resolves.toEqual({ name: 'v2' });
    });

    it('returns undefined when no version name matches', async () => {
      versionUtilService.fetchVersions.mockResolvedValue([{ name: 'v1' }]);
      await expect(svc.findMatchingVersion('app1', 'nope')).resolves.toBeUndefined();
    });
  });

  describe('deleteMatchingVersionIfExists', () => {
    it('no-ops when there is no matching version', async () => {
      await svc.deleteMatchingVersionIfExists(null as any, {} as any);
      expect(appVersionRepository.getAppVersionById).not.toHaveBeenCalled();
    });

    it('deletes the resolved version via the git-aware delete path', async () => {
      appVersionRepository.getAppVersionById.mockResolvedValue({ id: 'ver-1' });
      const app = { id: 'app-1' } as any;
      await svc.deleteMatchingVersionIfExists({ id: 'ver-1' } as any, app);
      expect(versionUtilService.deleteVersionGit).toHaveBeenCalledWith(app, { id: 'ver-1' }, undefined);
    });

    it('skips the delete when the version row is not found', async () => {
      appVersionRepository.getAppVersionById.mockResolvedValue(null);
      await svc.deleteMatchingVersionIfExists({ id: 'gone' } as any, {} as any);
      expect(versionUtilService.deleteVersionGit).not.toHaveBeenCalled();
    });
  });
});
