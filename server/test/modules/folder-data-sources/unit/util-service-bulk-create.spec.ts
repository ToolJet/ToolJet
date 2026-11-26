/** @group platform */
import { FolderDataSourcesUtilService } from '../../../../src/modules/folder-data-sources/util.service';

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn(),
  getConnectionInstance: jest.fn(),
}));
import { dbTransactionWrap } from '../../../../src/helpers/database.helper';

describe('FolderDataSourcesUtilService.bulkCreate', () => {
  const saved: Array<{ folderId: string; dataSourceId: string }> = [];
  const manager = {
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
    create: jest.fn((_entity, data) => data),
    save: jest.fn(async (_entity, rows) => {
      saved.push(...rows);
      return rows;
    }),
  };
  const service = new FolderDataSourcesUtilService();

  beforeEach(() => {
    saved.length = 0;
    (dbTransactionWrap as jest.Mock).mockImplementation((op) => op(manager));
  });

  it('should insert a repeated data source id only once', async () => {
    await service.bulkCreate('folder-1', ['ds-a', 'ds-a'], 'branch-1');

    expect(saved).toEqual([{ folderId: 'folder-1', dataSourceId: 'ds-a', branchId: 'branch-1' }]);
  });

  it('should keep distinct ids and drop only the repeats', async () => {
    await service.bulkCreate('folder-1', ['ds-a', 'ds-b', 'ds-a'], 'branch-1');

    expect(saved.map((r) => r.dataSourceId)).toEqual(['ds-a', 'ds-b']);
  });
});
