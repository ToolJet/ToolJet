/** @group platform */
import { FolderAppsUtilService } from '../../../../src/modules/folder-apps/util.service';

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn(),
  getConnectionInstance: jest.fn(),
}));
import { dbTransactionWrap } from '../../../../src/helpers/database.helper';

describe('FolderAppsUtilService.bulkCreate', () => {
  const saved: Array<{ folderId: string; appId: string }> = [];
  const manager = {
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
    create: jest.fn((_entity, data) => data),
    save: jest.fn(async (_entity, rows) => {
      saved.push(...rows);
      return rows;
    }),
  };
  const service = new FolderAppsUtilService(null as any);

  beforeEach(() => {
    saved.length = 0;
    (dbTransactionWrap as jest.Mock).mockImplementation((op) => op(manager));
  });

  it('should insert a repeated app id only once', async () => {
    await service.bulkCreate('folder-1', ['app-a', 'app-a'], 'branch-1');

    expect(saved).toEqual([{ folderId: 'folder-1', appId: 'app-a', branchId: 'branch-1' }]);
  });

  it('should keep distinct ids and drop only the repeats', async () => {
    await service.bulkCreate('folder-1', ['app-a', 'app-b', 'app-a'], 'branch-1');

    expect(saved.map((r) => r.appId)).toEqual(['app-a', 'app-b']);
  });
});
