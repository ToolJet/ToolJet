/**
 * VersionService.persistActiveVersion — write-side bookkeeping for the in-editor
 * version switch (GET /v2/apps/:id/versions/:versionId), the counterpart to
 * AppsService's write on initial app open.
 * @group platform
 */
import { VersionService } from '@modules/versions/service';

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
