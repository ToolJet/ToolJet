/**
 * FolderDataSourcesUtilService.getFoldersWithDataSourceIds — builds the data-source-folder tree for
 * the app builder (getForApp): it intersects each folder's branch membership with the already
 * permission-filtered data-source ids (NO permission is resolved here) and drops folders left empty.
 *
 * Pure: the service is constructed directly and driven with a stub EntityManager + a stubbed
 * findFolderDataSourcesForFolders — no DB, no Nest app. dbTransactionWrap short-circuits to the
 * passed manager, so the manager stub is used verbatim.
 *
 * @group platform
 */
import { FolderDataSourcesUtilService } from 'src/modules/folder-data-sources/util.service';

const ORG = 'org-1';
const BRANCH = 'branch-1';

type FakeFolder = {
  id: string;
  name: string;
  type: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

const folderA: FakeFolder = {
  id: 'f-a',
  name: 'Analytics',
  type: 'data_source',
  organizationId: ORG,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
};
const folderB: FakeFolder = {
  id: 'f-b',
  name: 'Reporting',
  type: 'data_source',
  organizationId: ORG,
  createdAt: new Date('2026-01-03T00:00:00Z'),
  updatedAt: new Date('2026-01-04T00:00:00Z'),
};

function makeService(folders: FakeFolder[], memberships: Array<{ folderId: string; dataSourceId: string }>) {
  const service = new FolderDataSourcesUtilService();
  const manager = { find: jest.fn().mockResolvedValue(folders) } as any;
  jest.spyOn(service, 'findFolderDataSourcesForFolders').mockResolvedValue(memberships as any);
  return { service, manager };
}

describe('FolderDataSourcesUtilService.getFoldersWithDataSourceIds', () => {
  afterEach(() => jest.restoreAllMocks());

  it('should keep only permitted data source ids per folder and preserve folder metadata', async () => {
    const { service, manager } = makeService(
      [folderA, folderB],
      [
        { folderId: 'f-a', dataSourceId: 'ds-1' },
        { folderId: 'f-a', dataSourceId: 'ds-2' }, // not permitted -> dropped
        { folderId: 'f-b', dataSourceId: 'ds-3' },
      ]
    );

    const result = await service.getFoldersWithDataSourceIds(ORG, BRANCH, ['ds-1', 'ds-3'], manager);

    expect(result).toEqual([
      {
        id: 'f-a',
        name: 'Analytics',
        type: 'data_source',
        organizationId: ORG,
        createdAt: folderA.createdAt,
        updatedAt: folderA.updatedAt,
        dataSourceIds: ['ds-1'],
      },
      {
        id: 'f-b',
        name: 'Reporting',
        type: 'data_source',
        organizationId: ORG,
        createdAt: folderB.createdAt,
        updatedAt: folderB.updatedAt,
        dataSourceIds: ['ds-3'],
      },
    ]);
    // Membership fetch is branch-scoped for exactly the folder ids in the org.
    expect(service.findFolderDataSourcesForFolders).toHaveBeenCalledWith(['f-a', 'f-b'], BRANCH, manager);
  });

  it('should drop folders whose members are all non-permitted (empty folders removed)', async () => {
    const { service, manager } = makeService(
      [folderA, folderB],
      [
        { folderId: 'f-a', dataSourceId: 'ds-1' },
        { folderId: 'f-b', dataSourceId: 'ds-9' }, // not permitted -> folder B becomes empty
      ]
    );

    const result = await service.getFoldersWithDataSourceIds(ORG, BRANCH, ['ds-1'], manager);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('f-a');
    expect(result[0].dataSourceIds).toEqual(['ds-1']);
  });

  it('should return [] and run no queries when there are no permitted data sources', async () => {
    const { service, manager } = makeService([folderA], []);

    const result = await service.getFoldersWithDataSourceIds(ORG, BRANCH, [], manager);

    expect(result).toEqual([]);
    expect(manager.find).not.toHaveBeenCalled();
    expect(service.findFolderDataSourcesForFolders).not.toHaveBeenCalled();
  });

  it('should return [] when the org has no data-source folders (no membership query)', async () => {
    const { service, manager } = makeService([], []);

    const result = await service.getFoldersWithDataSourceIds(ORG, BRANCH, ['ds-1'], manager);

    expect(result).toEqual([]);
    expect(service.findFolderDataSourcesForFolders).not.toHaveBeenCalled();
  });

  it('should return [] and run no queries when branchId is missing', async () => {
    const { service, manager } = makeService([folderA], []);

    const result = await service.getFoldersWithDataSourceIds(ORG, '', ['ds-1'], manager);

    expect(result).toEqual([]);
    expect(manager.find).not.toHaveBeenCalled();
  });

  it('should not carry a data source into more than one folder (membership drives placement)', async () => {
    // A data source lives in exactly one folder per branch, but the intersection must still be
    // faithful to membership rows — a permitted ds only appears under the folder it belongs to.
    const { service, manager } = makeService(
      [folderA, folderB],
      [
        { folderId: 'f-a', dataSourceId: 'ds-1' },
        { folderId: 'f-b', dataSourceId: 'ds-2' },
      ]
    );

    const result = await service.getFoldersWithDataSourceIds(ORG, BRANCH, ['ds-1', 'ds-2'], manager);

    expect(result.find((f) => f.id === 'f-a')?.dataSourceIds).toEqual(['ds-1']);
    expect(result.find((f) => f.id === 'f-b')?.dataSourceIds).toEqual(['ds-2']);
  });
});
