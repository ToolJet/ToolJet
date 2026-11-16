import { VersionService } from '@modules/versions/service';
import { AppVersionStatus, AppVersionType } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';

/** @group platform */
describe('VersionService.getAllVersions across branches', () => {
  const app = { id: 'app-1', organizationId: 'org-1', type: 'front-end' } as App;
  const mainBranch = { id: 'br-main', name: 'main', isDefault: true };
  const featureA = { id: 'br-a', name: 'feature/a', isDefault: false };
  const featureB = { id: 'br-b', name: 'feature/b', isDefault: false };

  const mainDraft = {
    id: 'v-main',
    status: AppVersionStatus.DRAFT,
    versionType: AppVersionType.VERSION,
    isSynced: true,
    branchId: mainBranch.id,
    branch: mainBranch,
  };
  const draftA = {
    id: 'v-a',
    status: AppVersionStatus.DRAFT,
    versionType: AppVersionType.BRANCH,
    isSynced: true,
    branchId: featureA.id,
    branch: featureA,
  };
  const draftB = {
    id: 'v-b',
    status: AppVersionStatus.DRAFT,
    versionType: AppVersionType.BRANCH,
    isSynced: true,
    branchId: featureB.id,
    branch: featureB,
  };

  const setup = () => {
    const getVersionsInApp = jest.fn(async (_appId: string, branchId?: string) => {
      const all = [mainDraft, draftA, draftB].map((version) => ({ ...version }));
      return branchId ? all.filter((version) => version.branchId === branchId) : all;
    });
    const service = Object.assign(Object.create(VersionService.prototype), {
      versionRepository: { getVersionsInApp, manager: { findOne: jest.fn().mockResolvedValue(mainBranch) } },
      gitSyncConfigsUtilService: {
        getDetails: jest.fn().mockResolvedValue({ isEnabled: true, options: { defaultBranch: mainBranch } }),
      },
    }) as VersionService;
    return { service, getVersionsInApp };
  };

  it('lists only the current branch rows by default', async () => {
    const { service } = setup();
    const { versions } = await service.getAllVersions(app, featureA.id);
    expect(versions.map((version) => version.id)).toEqual(['v-a']);
  });

  it('lists the drafts of every branch when asked, so one branch can be compared with another', async () => {
    const { service } = setup();
    const { versions } = await (service as any).getAllVersions(app, featureA.id, false, true);
    expect(versions.map((version) => version.id).sort()).toEqual(['v-a', 'v-b', 'v-main']);
  });

  it('names a branch draft by its branch', async () => {
    const { service } = setup();
    const { versions } = await (service as any).getAllVersions(app, mainBranch.id, false, true);
    expect(versions.find((version) => version.id === 'v-b')?.displayName).toBe('feature/b');
  });

  it('puts the rows of the current branch first', async () => {
    const { service } = setup();
    const { versions } = await (service as any).getAllVersions(app, featureB.id, false, true);
    expect(versions).toHaveLength(3);
    expect(versions[0].id).toBe('v-b');
  });
});
