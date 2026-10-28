/**
 * GET /apps/:id/versions/:versionId/library-pins: the app guard does not tie versionId to the app when the URL
 * uses a slug, so the service must, or another workspace's version would leak its query names.
 */
import { NotFoundException } from '@nestjs/common';
import { VersionService } from '@modules/versions/service';

const VERSION = '00000000-0000-4000-8000-000000000001';
const user = { id: 'u1', organizationId: 'org-1' } as never;
const app = { id: 'app-1', organizationId: 'org-1' } as never;

function build(versionBelongsToApp: boolean) {
  const svc = Object.create(VersionService.prototype) as VersionService;
  const exists = jest.fn(async () => versionBelongsToApp);
  const getLibraryPinsForAppVersion = jest.fn(async () => [{ consumerQueryName: 'q1' }]);
  Object.assign(svc, {
    versionRepository: { exists, manager: {} },
    appUtilService: { getLibraryPinsForAppVersion },
  });
  return { svc, exists, getLibraryPinsForAppVersion };
}

describe('VersionService.getLibraryPins', () => {
  it('should return the pins of a version of the app', async () => {
    const { svc, exists } = build(true);
    await expect(svc.getLibraryPins(app, VERSION, user)).resolves.toEqual({ pins: [{ consumerQueryName: 'q1' }] });
    expect(exists).toHaveBeenCalledWith({ where: { id: VERSION, appId: 'app-1' } });
  });

  it('should 404 for a version of another app or workspace', async () => {
    const { svc, getLibraryPinsForAppVersion } = build(false);
    await expect(svc.getLibraryPins(app, VERSION, user)).rejects.toBeInstanceOf(NotFoundException);
    expect(getLibraryPinsForAppVersion).not.toHaveBeenCalled();
  });

  it('should 404 when the app is not in the caller workspace', async () => {
    const { svc, exists } = build(true);
    const foreignApp = { id: 'app-1', organizationId: 'org-2' } as never;
    await expect(svc.getLibraryPins(foreignApp, VERSION, user)).rejects.toBeInstanceOf(NotFoundException);
    expect(exists).not.toHaveBeenCalled();
  });

  it('should 404 for a malformed version id without querying', async () => {
    const { svc, exists } = build(true);
    await expect(svc.getLibraryPins(app, 'not-a-uuid', user)).rejects.toBeInstanceOf(NotFoundException);
    expect(exists).not.toHaveBeenCalled();
  });
});
