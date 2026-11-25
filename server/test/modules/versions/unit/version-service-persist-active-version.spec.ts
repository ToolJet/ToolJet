/**
 * VersionService.persistActiveVersion — write-side bookkeeping for the in-editor
 * version switch (GET /v2/apps/:id/versions/:versionId), the counterpart to
 * AppsService's write on initial app open.
 * @group platform
 */
import { VersionService } from '@modules/versions/service';
import { resolveModuleRef } from '@modules/versions/module-ref.util';

jest.mock('@modules/versions/module-ref.util', () => ({
  ...jest.requireActual('@modules/versions/module-ref.util'),
  resolveModuleRef: jest.fn(),
}));

const makeSvc = () => {
  const svc = Object.create(VersionService.prototype) as any;
  svc.userAppVersionStateRepository = { upsertLastActiveVersion: jest.fn().mockResolvedValue(undefined) };
  return svc;
};

const user = { id: 'user-1' } as any;
const app = { id: 'app-1' } as any;

describe('VersionService.persistActiveVersion', () => {
  it('upserts the switched-to version', () => {
    const svc = makeSvc();
    svc.persistActiveVersion(user, app, { id: 'v-2', versionType: 'version' });
    expect(svc.userAppVersionStateRepository.upsertLastActiveVersion).toHaveBeenCalledWith('user-1', 'app-1', 'v-2');
  });

  it('does not upsert a feature-branch draft (BRANCH type)', () => {
    const svc = makeSvc();
    svc.persistActiveVersion(user, app, { id: 'v-branch', versionType: 'branch' });
    expect(svc.userAppVersionStateRepository.upsertLastActiveVersion).not.toHaveBeenCalled();
  });

  it('does not upsert when no version was resolved', () => {
    const svc = makeSvc();
    svc.persistActiveVersion(user, app, undefined);
    expect(svc.userAppVersionStateRepository.upsertLastActiveVersion).not.toHaveBeenCalled();
  });

  it('swallows a failed write instead of throwing', () => {
    const svc = makeSvc();
    svc.userAppVersionStateRepository.upsertLastActiveVersion.mockRejectedValue(new Error('write failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => svc.persistActiveVersion(user, app, { id: 'v-2', versionType: 'version' })).not.toThrow();
    consoleErrorSpy.mockRestore();
  });
});

describe('VersionService.getVersionByStableIds (module embedded in a host app)', () => {
  it('loads the module without remembering its version, so the module editor keeps its own', async () => {
    const svc = makeSvc() as any;
    const moduleApp = { id: 'module-1', type: 'module' };
    svc.versionRepository = { manager: { findOne: jest.fn().mockResolvedValue(moduleApp) } };
    svc.gitSyncConfigsUtilService = { getDetails: jest.fn().mockResolvedValue({ isEnabled: false }) };
    svc.getVersion = jest.fn().mockResolvedValue({});
    (resolveModuleRef as jest.Mock).mockResolvedValue({ id: 'v-1' });

    await svc.getVersionByStableIds('co-rel', 'ref', { id: 'user-1', organizationId: 'org-1' }, 'edit', 'branch-1');

    expect(svc.getVersion).toHaveBeenCalledWith(moduleApp, expect.anything(), 'edit', { persistActive: false });
  });
});
