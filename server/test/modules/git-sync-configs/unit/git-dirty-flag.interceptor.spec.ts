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
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQuery } from '@entities/data_query.entity';
import { GitDirtyFlagInterceptor } from '@modules/git-sync-configs/interceptors/git-dirty-flag.interceptor';
import {
  MarksAppVersionDirty,
  MarksDataSourceDirty,
  MarksQueryFolderDirty,
} from '@modules/git-sync-configs/decorators/marks-git-dirty.decorator';

class Handlers {
  @MarksAppVersionDirty()
  appVersionWrite() {}

  @MarksDataSourceDirty()
  dataSourceWrite() {}

  @MarksQueryFolderDirty()
  queryFolderWrite() {}

  unmarked() {}
}

type Request = { params?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown };

describe('GitDirtyFlagInterceptor', () => {
  let appVersionUpdate: jest.Mock;
  let dataSourceVersionUpdate: jest.Mock;
  let folderFindOne: jest.Mock;
  let queryFindOne: jest.Mock;
  let interceptor: GitDirtyFlagInterceptor;

  const ctx = (handler: () => void, request: Request): ExecutionContext =>
    ({ getHandler: () => handler, switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;
  const respondWith = (result: unknown): CallHandler => ({ handle: () => of(result) });
  const run = (handler: () => void, request: Request, next: CallHandler = respondWith({ ok: true })) =>
    lastValueFrom(interceptor.intercept(ctx(handler, request), next));

  beforeEach(() => {
    appVersionUpdate = jest.fn().mockResolvedValue({ affected: 1 });
    dataSourceVersionUpdate = jest.fn().mockResolvedValue({ affected: 1 });
    folderFindOne = jest.fn().mockResolvedValue({ id: 'folder-1', appVersionId: 'ver-folder' });
    queryFindOne = jest.fn().mockResolvedValue({ id: 'query-1', appVersionId: 'ver-query' });
    const dataSource = {
      getRepository: (entity: unknown) => ({
        update:
          entity === AppVersion ? appVersionUpdate : entity === DataSourceVersion ? dataSourceVersionUpdate : null,
        findOne: entity === DataQueryFolder ? folderFindOne : entity === DataQuery ? queryFindOne : null,
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

  describe('@MarksQueryFolderDirty', () => {
    const flagged = (id: string) => [
      { id, isSynced: true, hasUncommittedChanges: false },
      { hasUncommittedChanges: true },
    ];

    it('should flag body.appVersionId on folder create, without a lookup', async () => {
      await run(Handlers.prototype.queryFolderWrite, { params: {}, body: { name: 'F', appVersionId: 'ver-create' } });
      expect(appVersionUpdate).toHaveBeenCalledWith(...flagged('ver-create'));
      expect(folderFindOne).not.toHaveBeenCalled();
    });

    it("should flag the :id folder's version on rename", async () => {
      await run(Handlers.prototype.queryFolderWrite, { params: { id: 'folder-1' }, body: { name: 'Renamed' } });
      expect(folderFindOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'folder-1' } }));
      expect(appVersionUpdate).toHaveBeenCalledWith(...flagged('ver-folder'));
    });

    it('should resolve the version before the handler runs, so a delete that removes the folder is still flagged', async () => {
      const order: string[] = [];
      folderFindOne.mockImplementation(async () => {
        order.push('resolve');
        return { id: 'folder-1', appVersionId: 'ver-folder' };
      });
      const deleting: CallHandler = {
        handle: () => {
          order.push('handler');
          folderFindOne.mockResolvedValue(null);
          return of(undefined);
        },
      };

      await run(
        Handlers.prototype.queryFolderWrite,
        { params: { id: 'folder-1' }, body: { mode: 'folder_only' } },
        deleting
      );
      expect(order).toEqual(['resolve', 'handler']);
      expect(appVersionUpdate).toHaveBeenCalledWith(...flagged('ver-folder'));
    });

    it("should flag the moved query's version on reorder", async () => {
      await run(Handlers.prototype.queryFolderWrite, {
        params: {},
        body: { childId: 'query-1', childType: 'query', newIndex: 0, parentId: null },
      });
      expect(queryFindOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'query-1' } }));
      expect(appVersionUpdate).toHaveBeenCalledWith(...flagged('ver-query'));
    });

    it("should flag the first item's version on batch reorder", async () => {
      await run(Handlers.prototype.queryFolderWrite, {
        params: {},
        body: { items: [{ childId: 'folder-1', childType: 'folder', index: 0, parentId: null }] },
      });
      expect(folderFindOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'folder-1' } }));
      expect(appVersionUpdate).toHaveBeenCalledWith(...flagged('ver-folder'));
    });

    it('should do nothing when the target cannot be resolved', async () => {
      folderFindOne.mockResolvedValue(null);
      await run(Handlers.prototype.queryFolderWrite, { params: { id: 'missing' }, body: {} });
      await run(Handlers.prototype.queryFolderWrite, { params: {}, body: { items: [] } });
      expect(appVersionUpdate).not.toHaveBeenCalled();
    });

    it('should not flag anything when the underlying write fails', async () => {
      const failing: CallHandler = { handle: () => throwError(() => new Error('write failed')) };
      await expect(
        run(Handlers.prototype.queryFolderWrite, { params: { id: 'folder-1' }, body: {} }, failing)
      ).rejects.toThrow('write failed');
      expect(appVersionUpdate).not.toHaveBeenCalled();
    });

    it('should still run the write, and log a warning, when resolving the version fails', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      folderFindOne.mockRejectedValue(new Error('db down'));

      await expect(
        run(
          Handlers.prototype.queryFolderWrite,
          { params: { id: 'folder-1' }, body: {} },
          respondWith({ id: 'folder-1' })
        )
      ).resolves.toEqual({ id: 'folder-1' });
      expect(appVersionUpdate).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('db down'));
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
