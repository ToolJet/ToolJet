/**
 * AppsService.resolveBranchAwareEditingVersion — unified version-fallback chain.
 * Covers: URL name -> user_app_version_state -> last-created (createdAt DESC, branchId IS NULL
 * included), applied on the default branch, on git-off apps, and on Workflows; unchanged
 * tip-only behavior on a feature branch.
 * @group platform
 */
import { EntityNotFoundError } from 'typeorm';
import { AppsService } from '../../../../src/modules/apps/service';
import { APP_TYPES } from '../../../../src/modules/apps/constants';
import { AppVersion } from '@entities/app_version.entity';

const makeSvc = (overrides: Partial<Record<string, any>> = {}) => {
  const svc = Object.create(AppsService.prototype) as any;
  svc.gitSyncConfigsUtilService = {
    getDetails: jest.fn().mockResolvedValue({ options: { defaultBranch: { id: 'default-branch' } } }),
  };
  svc.versionRepository = {
    findOne: jest.fn(),
    findByName: jest.fn(),
  };
  svc.userAppVersionStateRepository = { findForUserApp: jest.fn().mockResolvedValue(null) };
  Object.assign(svc, overrides);
  return svc as AppsService;
};

const app = (type = APP_TYPES.FRONT_END) => ({ id: 'app-1', organizationId: 'org-1', type }) as any;
const user = { id: 'user-1' } as any;

describe('AppsService.resolveBranchAwareEditingVersion', () => {
  it('on a feature branch, keeps tip-only behavior and never checks user_app_version_state', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findOne.mockResolvedValue({ id: 'v-tip', versionType: 'BRANCH' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'feature-branch', user, undefined);
    expect(a.editingVersion?.id).toBe('v-tip');
    expect((svc as any).userAppVersionStateRepository.findForUserApp).not.toHaveBeenCalled();
  });

  it('on the default branch, prefers an explicit ?version= name over last-active', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findByName.mockResolvedValue({ id: 'v-named' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, 'my-saved-version');
    expect(a.editingVersion?.id).toBe('v-named');
    expect((svc as any).userAppVersionStateRepository.findForUserApp).not.toHaveBeenCalled();
  });

  it('on the default branch, uses the last-active version when no URL version is given', async () => {
    const svc = makeSvc();
    (svc as any).userAppVersionStateRepository.findForUserApp.mockResolvedValue({ versionId: 'v-last-active' });
    (svc as any).versionRepository.findOne.mockResolvedValue({ id: 'v-last-active' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, undefined);
    expect(a.editingVersion?.id).toBe('v-last-active');
  });

  it('falls to last-created (createdAt DESC) when there is no URL version and no last-active state', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findOne.mockResolvedValue({ id: 'v-newest' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, undefined);
    expect(a.editingVersion?.id).toBe('v-newest');
    const call = (svc as any).versionRepository.findOne.mock.calls[0][0];
    expect(call.order).toEqual({ createdAt: 'DESC' });
  });

  it('applies the fallback chain for Workflows even when a feature branch is active elsewhere', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findOne.mockResolvedValue({ id: 'v-workflow' });
    const a = app(APP_TYPES.WORKFLOW);
    await (svc as any).resolveBranchAwareEditingVersion(a, 'feature-branch', user, undefined);
    expect(a.editingVersion?.id).toBe('v-workflow');
    // Workflows never do the feature-branch tip lookup — always the fallback chain.
    expect((svc as any).gitSyncConfigsUtilService.getDetails).not.toHaveBeenCalled();
  });

  it('falls through to last-active when an explicit ?version= name does not resolve (stale link)', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findByName.mockRejectedValue(new EntityNotFoundError(AppVersion, {}));
    (svc as any).userAppVersionStateRepository.findForUserApp.mockResolvedValue({ versionId: 'v-last-active' });
    (svc as any).versionRepository.findOne.mockResolvedValue({ id: 'v-last-active' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, 'stale-name');
    expect(a.editingVersion?.id).toBe('v-last-active');
  });

  it('rejects a ?version= name that resolves to a feature-branch draft, falling through instead', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findByName.mockResolvedValue({
      id: 'v-branch-draft',
      versionType: 'BRANCH',
      branchId: 'feature-branch',
    });
    (svc as any).versionRepository.findOne.mockResolvedValue({ id: 'v-newest' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, 'some-branch-name');
    expect(a.editingVersion?.id).toBe('v-newest');
  });

  it('falls through to last-created when the last-active pointer is stale (version deleted)', async () => {
    const svc = makeSvc();
    (svc as any).userAppVersionStateRepository.findForUserApp.mockResolvedValue({ versionId: 'deleted-version' });
    (svc as any).versionRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'v-newest' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, undefined);
    expect(a.editingVersion?.id).toBe('v-newest');
  });

  it('rethrows a non-EntityNotFoundError from the named-version lookup', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findByName.mockRejectedValue(new Error('db unreachable'));
    const a = app();
    await expect((svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, 'some-name')).rejects.toThrow(
      'db unreachable'
    );
  });

  it('marks the app a stub when nothing resolves anywhere in the chain', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findOne.mockResolvedValue(null);
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, undefined);
    expect(a.editingVersion).toBeUndefined();
    expect((a as any).isStub).toBe(true);
  });

  it('scopes the last-created query to the default branch plus legacy branchId-null rows', async () => {
    const svc = makeSvc();
    (svc as any).versionRepository.findOne.mockResolvedValue({ id: 'v-newest' });
    const a = app();
    await (svc as any).resolveBranchAwareEditingVersion(a, 'default-branch', user, undefined);
    const call = (svc as any).versionRepository.findOne.mock.calls[0][0];
    expect(call.where).toHaveLength(2);
    expect(call.where[0]).toMatchObject({ branchId: 'default-branch' });
    expect(call.where[1].branchId).toMatchObject({ type: 'isNull' });
  });
});
