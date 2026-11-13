/**
 * GitDirtyFlagInterceptor — flags the version a write touched as uncommitted. No Nest app / DB.
 *
 * @group gitsync
 */
import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { AppVersion } from '@entities/app_version.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { GitDirtyFlagInterceptor } from '@modules/git-sync-configs/interceptors/git-dirty-flag.interceptor';
import {
  MarksAppVersionDirty,
  MarksDataSourceDirty,
} from '@modules/git-sync-configs/decorators/marks-git-dirty.decorator';

class Handlers {
  @MarksAppVersionDirty()
  appVersionWrite() {}

  @MarksDataSourceDirty()
  dataSourceWrite() {}

  unmarked() {}
}

type Request = { params?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown };

describe('GitDirtyFlagInterceptor', () => {
  let appVersionUpdate: jest.Mock;
  let dataSourceVersionUpdate: jest.Mock;
  let interceptor: GitDirtyFlagInterceptor;

  const ctx = (handler: () => void, request: Request): ExecutionContext =>
    ({ getHandler: () => handler, switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;
  const respondWith = (result: unknown): CallHandler => ({ handle: () => of(result) });
  const run = (handler: () => void, request: Request, next: CallHandler = respondWith({ ok: true })) =>
    lastValueFrom(interceptor.intercept(ctx(handler, request), next));

  beforeEach(() => {
    appVersionUpdate = jest.fn().mockResolvedValue({ affected: 1 });
    dataSourceVersionUpdate = jest.fn().mockResolvedValue({ affected: 1 });
    const dataSource = {
      getRepository: (entity: unknown) => ({
        update:
          entity === AppVersion ? appVersionUpdate : entity === DataSourceVersion ? dataSourceVersionUpdate : null,
      }),
    };
    interceptor = new GitDirtyFlagInterceptor(new Reflector(), dataSource as never);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('unmarked routes', () => {
    it('should pass the response through without touching any version', async () => {
      await expect(run(Handlers.prototype.unmarked, { params: { versionId: 'ver-1' } })).resolves.toEqual({ ok: true });
      expect(appVersionUpdate).not.toHaveBeenCalled();
      expect(dataSourceVersionUpdate).not.toHaveBeenCalled();
    });
  });

  describe('@MarksAppVersionDirty', () => {
    it('should flag the :versionId version, only when it is synced and not already flagged', async () => {
      await expect(run(Handlers.prototype.appVersionWrite, { params: { versionId: 'ver-1' } })).resolves.toEqual({
        ok: true,
      });
      expect(appVersionUpdate).toHaveBeenCalledWith(
        { id: 'ver-1', isSynced: true, hasUncommittedChanges: false },
        { hasUncommittedChanges: true }
      );
      expect(dataSourceVersionUpdate).not.toHaveBeenCalled();
    });

    it('should fall back to body.app_version_id when the route has no :versionId', async () => {
      await run(Handlers.prototype.appVersionWrite, { params: {}, body: { app_version_id: 'ver-body' } });
      expect(appVersionUpdate).toHaveBeenCalledWith(
        { id: 'ver-body', isSynced: true, hasUncommittedChanges: false },
        { hasUncommittedChanges: true }
      );
    });

    it('should do nothing when neither :versionId nor app_version_id is a string', async () => {
      await run(Handlers.prototype.appVersionWrite, { params: { versionId: ['ver-1'] }, body: { app_version_id: 42 } });
      await run(Handlers.prototype.appVersionWrite, {});
      expect(appVersionUpdate).not.toHaveBeenCalled();
    });
  });

  describe('@MarksDataSourceDirty', () => {
    it('should flag only the branch_id version of the :id data source', async () => {
      await run(Handlers.prototype.dataSourceWrite, { params: { id: 'ds-1' }, query: { branch_id: 'branch-1' } });
      expect(dataSourceVersionUpdate).toHaveBeenCalledWith(
        { dataSourceId: 'ds-1', branchId: 'branch-1', isSynced: true, hasUncommittedChanges: false },
        { hasUncommittedChanges: true }
      );
      expect(appVersionUpdate).not.toHaveBeenCalled();
    });

    it('should flag every synced version of the data source when no branch_id is given', async () => {
      await run(Handlers.prototype.dataSourceWrite, { params: { id: 'ds-1' }, query: {} });
      expect(dataSourceVersionUpdate).toHaveBeenCalledWith(
        { dataSourceId: 'ds-1', isSynced: true, hasUncommittedChanges: false },
        { hasUncommittedChanges: true }
      );
    });

    it('should do nothing when the route has no :id', async () => {
      await run(Handlers.prototype.dataSourceWrite, { params: {}, query: { branch_id: 'branch-1' } });
      expect(dataSourceVersionUpdate).not.toHaveBeenCalled();
    });
  });

  describe('failure handling', () => {
    it('should not flag anything when the underlying write fails', async () => {
      const failing: CallHandler = { handle: () => throwError(() => new Error('write failed')) };
      await expect(
        run(Handlers.prototype.appVersionWrite, { params: { versionId: 'ver-1' } }, failing)
      ).rejects.toThrow('write failed');
      expect(appVersionUpdate).not.toHaveBeenCalled();
    });

    it('should still return the response, and log a warning, when setting the flag fails', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      appVersionUpdate.mockRejectedValue(new Error('db down'));

      await expect(
        run(Handlers.prototype.appVersionWrite, { params: { versionId: 'ver-1' } }, respondWith({ id: 'component-1' }))
      ).resolves.toEqual({ id: 'component-1' });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('db down'));
    });
  });
});
