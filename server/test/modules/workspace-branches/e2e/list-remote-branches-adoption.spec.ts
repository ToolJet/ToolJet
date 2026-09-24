import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { initTestApp, createUser, closeTestApp } from 'test-helper';
import { WorkspaceBranchService } from '@ee/workspace-branches/service';
import { GitSyncConfigsUtilService } from '@ee/git-sync-configs/util.service';
import { SourceControlProviderService as GitSyncProviderService } from '@ee/git-sync/source-control-provider';
import { RemoteBranchCacheService } from '@ee/git-sync-configs/services/remote-branch-cache.service';
import { GITConnectionType } from '@entities/organization_git_sync.entity';

/**
 * Regression for the "GET /api/workspace-branches/remote lists only main" report.
 *
 * `/remote` intersects the provider's branch list with organization_git_sync_branches, so a branch
 * created directly on the provider (GitLab/GitHub UI or CLI) — with no DB row — was silently dropped,
 * and a workspace with only the default `main` row saw only `main` regardless of what the remote held.
 * listRemoteBranches now ADOPTS those untracked remote branches into the DB (multi-branch mode) so they
 * appear in the branch list and become switchable.
 *
 * The git provider is mocked, so this runs in the gitsync shard without a live simulator.
 *
 * @group gitsync
 */
describe('WorkspaceBranchService.listRemoteBranches — adopt provider-created branches', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let service: WorkspaceBranchService;
    let organizationId: string;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      dataSource = app.get<DataSource>(getDataSourceToken('default'));
      const { organization } = await createUser(app, {
        email: 'branch.adopt@tooljet.io',
        firstName: 'branch',
        lastName: 'adopt',
      });
      organizationId = organization.id;
      service = app.get(WorkspaceBranchService, { strict: false });
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60000);

    afterEach(() => jest.resetAllMocks());

    // Seed the default branch fresh inside each test's savepoint so tests stay hermetic —
    // the savepoint rollback in afterEach removes it (and any adopted rows) after every test.
    const seedDefaultBranch = async (): Promise<string> => {
      await dataSource.query(
        `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default)
           VALUES ($1, 'main', true) ON CONFLICT (organization_id, branch_name) DO NOTHING`,
        [organizationId]
      );
      const [{ id }] = await dataSource.query(
        `SELECT id FROM organization_git_sync_branches WHERE organization_id = $1 AND branch_name = 'main'`,
        [organizationId]
      );
      return id;
    };

    // Stub the provider + config so listRemoteBranches sees `remoteNames` on the remote and the
    // given multi-branch state, with the cache forced to miss (so adoption actually runs).
    const stubProvider = (remoteNames: string[], isMultiBranchingEnabled: boolean) => {
      jest.spyOn(GitSyncConfigsUtilService.prototype, 'getDetails').mockResolvedValue({
        isEnabled: true,
        isMultiBranchingEnabled,
        options: { type: GITConnectionType.GITLAB, defaultBranch: null, isBranchingEnabled: true },
        orgGit: null,
      } as never);
      jest.spyOn(GitSyncProviderService.prototype, 'getSourceControlService').mockResolvedValue({
        listRemoteBranches: jest.fn().mockResolvedValue(remoteNames),
      } as never);
      jest.spyOn(RemoteBranchCacheService.prototype, 'get').mockResolvedValue(null);
      jest.spyOn(RemoteBranchCacheService.prototype, 'set').mockResolvedValue(undefined);
    };

    const trackedBranches = () =>
      dataSource.query(
        `SELECT branch_name, is_default, source_branch_id, created_by
           FROM organization_git_sync_branches WHERE organization_id = $1 ORDER BY branch_name`,
        [organizationId]
      );

    it('should track provider-created branches missing from the DB and return them (multi-branch mode)', async () => {
      const mainId = await seedDefaultBranch();
      stubProvider(['main', 'branch-1', 'branch-2'], true);

      const result = await service.listRemoteBranches(organizationId);

      expect(result.branches.map((b: { name: string }) => b.name).sort()).toEqual(['branch-1', 'branch-2', 'main']);
      // Adopted branches carry a real DB id, so the switch-branch modal can act on them.
      const branchOne = result.branches.find((b: { name: string }) => b.name === 'branch-1');
      expect(branchOne.id).toEqual(expect.any(String));

      // Each provider-only branch is now a tracked row: non-default, sourced from main,
      // createdBy null (so the modal treats it as a seeded branch and pulls before switching).
      const rows = await trackedBranches();
      expect(rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            branch_name: 'branch-1',
            is_default: false,
            source_branch_id: mainId,
            created_by: null,
          }),
          expect.objectContaining({
            branch_name: 'branch-2',
            is_default: false,
            source_branch_id: mainId,
            created_by: null,
          }),
        ])
      );
    });

    it('should not track feature branches in single-branch mode — returns only the default', async () => {
      await seedDefaultBranch();
      stubProvider(['main', 'branch-1', 'branch-2'], false);

      const result = await service.listRemoteBranches(organizationId);

      expect(result.branches.map((b: { name: string }) => b.name)).toEqual(['main']);
      const rows = await trackedBranches();
      expect(rows.map((r: { branch_name: string }) => r.branch_name)).toEqual(['main']);
    });

    it('should be idempotent — a second call tracks nothing new', async () => {
      await seedDefaultBranch();
      stubProvider(['main', 'branch-1'], true);

      await service.listRemoteBranches(organizationId);
      const afterFirst = await trackedBranches();
      await service.listRemoteBranches(organizationId);
      const afterSecond = await trackedBranches();

      expect(afterSecond).toHaveLength(afterFirst.length);
      expect(afterSecond.map((r: { branch_name: string }) => r.branch_name).sort()).toEqual(['branch-1', 'main']);
    });
  });
});
