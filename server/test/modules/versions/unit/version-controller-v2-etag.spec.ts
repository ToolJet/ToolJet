import { Request, Response } from 'express';
import { VersionControllerV2 } from '@modules/versions/controller.v2';
import { VersionService } from '@modules/versions/service';
import { AppVersionStatus } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { getAppDataRevision, VIEWER_LICENSE_FIELDS } from '@modules/apps/app-data-revision';
import { EntityManager } from 'typeorm';
import { getConnectionInstance } from '@helpers/database.helper';

jest.mock('@helpers/database.helper', () => ({ getConnectionInstance: jest.fn() }));
jest.mock('@modules/group-permissions/repository', () => ({
  findUserGroupsWithAppAccess: jest.fn().mockResolvedValue([]),
}));

/** @group platform */
describe('VersionControllerV2.getVersion caching', () => {
  const app = {
    id: 'app-1',
    name: 'Orders',
    isPublic: false,
    isMaintenanceOn: false,
    currentVersionId: 'ver-1',
    organizationId: 'org-1',
  } as App;
  const licenseTerms = { valid: true };
  const revisionQuery = () => jest.fn().mockResolvedValue([{ stamp: null }]);
  const user = { id: 'user-1' } as User;
  const versionUpdatedAt = new Date('2026-10-02T00:00:00.000Z');
  let etag: string;

  const setup = (status: AppVersionStatus | undefined, ifNoneMatch?: string, viewedApp: App = app, mode = 'view') => {
    const findOne = jest.fn().mockResolvedValue(status ? { id: 'ver-1', status, updatedAt: versionUpdatedAt } : null);
    (getConnectionInstance as jest.Mock).mockReturnValue({ manager: { findOne, query: revisionQuery() } });

    // A real VersionService (no Nest DI) with only what getVersion caching touches stubbed.
    const getVersion = jest.fn().mockResolvedValue({ editing_version: { id: 'ver-1' } });
    const getLicenseTerms = jest.fn().mockResolvedValue(licenseTerms);
    const versionService = Object.assign(Object.create(VersionService.prototype), {
      getVersion,
      licenseTermsService: { getLicenseTerms },
    }) as VersionService;
    const controller = new VersionControllerV2(versionService);
    const res = { set: jest.fn(), status: jest.fn() } as unknown as Response;
    const req = { headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {} } as unknown as Request;
    const call = () => controller.getVersion(user, viewedApp, 'ver-1', mode, req, res);
    return { call, res, getVersion, getLicenseTerms };
  };

  beforeEach(async () => {
    const revision = await getAppDataRevision({ query: revisionQuery() } as unknown as EntityManager, app, {
      versionId: 'ver-1',
      userId: 'user-1',
      licenseTerms,
    });
    etag = `"v-ver-1-view-${versionUpdatedAt.getTime()}-${revision}"`;
  });

  it('caches a published version with revalidation and an ETag', async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.PUBLISHED);

    await expect(call()).resolves.toEqual({ editing_version: { id: 'ver-1' } });

    expect(res.set).toHaveBeenCalledWith({ 'Cache-Control': 'private, no-cache', ETag: etag });
    expect(getVersion).toHaveBeenCalled();
  });

  it("keys the ETag on the workspace's viewer license terms", async () => {
    const { call, getLicenseTerms } = setup(AppVersionStatus.PUBLISHED);

    await call();

    expect(getLicenseTerms).toHaveBeenCalledWith(VIEWER_LICENSE_FIELDS, 'org-1');
  });

  it('answers 304 without building the response when the ETag matches', async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.PUBLISHED, etag);

    await expect(call()).resolves.toBeUndefined();

    expect(res.status).toHaveBeenCalledWith(304);
    expect(getVersion).not.toHaveBeenCalled();
  });

  it("doesn't answer an edit request with the view response's ETag, since only view is permission-filtered", async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.PUBLISHED, etag, app, 'edit');

    await call();

    expect(res.status).not.toHaveBeenCalledWith(304);
    expect(getVersion).toHaveBeenCalled();
  });

  it('sends the full response when the ETag is stale', async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.PUBLISHED, '"v-ver-1-old"');

    await call();

    expect(res.status).not.toHaveBeenCalled();
    expect(getVersion).toHaveBeenCalled();
  });

  it('never caches a published version that is not the released one', async () => {
    const { call, res, getVersion, getLicenseTerms } = setup(AppVersionStatus.PUBLISHED, etag, {
      ...app,
      currentVersionId: 'ver-2',
    } as App);

    await call();

    expect(getLicenseTerms).not.toHaveBeenCalled();
    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(getVersion).toHaveBeenCalled();
  });

  it('never caches a draft version', async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.DRAFT, etag);

    await call();

    expect(res.set).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(getVersion).toHaveBeenCalled();
  });
});
