import { Request, Response } from 'express';
import { VersionControllerV2 } from '@modules/versions/controller.v2';
import { VersionService } from '@modules/versions/service';
import { AppVersionStatus } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { getAppDataRevision, resetAppDataRevisionCache } from '@modules/apps/app-data-revision';
import { EntityManager } from 'typeorm';
import { getConnectionInstance } from '@helpers/database.helper';

jest.mock('@helpers/database.helper', () => ({ getConnectionInstance: jest.fn() }));

/** @group platform */
describe('VersionControllerV2.getVersion caching', () => {
  const app = { id: 'app-1', name: 'Orders', isPublic: false, isMaintenanceOn: false } as App;
  const user = { id: 'user-1' } as User;
  const versionUpdatedAt = new Date('2026-10-02T00:00:00.000Z');
  let etag: string;

  const setup = (status: AppVersionStatus | undefined, ifNoneMatch?: string) => {
    const findOne = jest.fn().mockResolvedValue(status ? { id: 'ver-1', status, updatedAt: versionUpdatedAt } : null);
    const query = jest.fn().mockResolvedValue([{ revision: '1787800000000' }]);
    (getConnectionInstance as jest.Mock).mockReturnValue({ manager: { findOne, query } });

    const getVersion = jest.fn().mockResolvedValue({ editing_version: { id: 'ver-1' } });
    const controller = new VersionControllerV2({ getVersion } as unknown as VersionService);
    const res = { set: jest.fn(), status: jest.fn() } as unknown as Response;
    const req = { headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {} } as unknown as Request;
    const call = () => controller.getVersion(user, app, 'ver-1', 'view', req, res);
    return { call, res, getVersion };
  };

  beforeEach(async () => {
    resetAppDataRevisionCache();
    const revision = await getAppDataRevision(
      { query: jest.fn().mockResolvedValue([{ revision: '1787800000000' }]) } as unknown as EntityManager,
      app
    );
    resetAppDataRevisionCache();
    etag = `"v-ver-1-${versionUpdatedAt.getTime()}-${revision}-user-1"`;
  });

  it('caches a published version with revalidation and an ETag', async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.PUBLISHED);

    await expect(call()).resolves.toEqual({ editing_version: { id: 'ver-1' } });

    expect(res.set).toHaveBeenCalledWith({ 'Cache-Control': 'private, no-cache', ETag: etag });
    expect(getVersion).toHaveBeenCalled();
  });

  it('answers 304 without building the response when the ETag matches', async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.PUBLISHED, etag);

    await expect(call()).resolves.toBeUndefined();

    expect(res.status).toHaveBeenCalledWith(304);
    expect(getVersion).not.toHaveBeenCalled();
  });

  it('sends the full response when the ETag is stale', async () => {
    const { call, res, getVersion } = setup(AppVersionStatus.PUBLISHED, '"v-ver-1-old"');

    await call();

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
