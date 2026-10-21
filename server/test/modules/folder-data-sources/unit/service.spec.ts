/**
 * FolderDataSourcesService.filterFoldersByPermissions — decides which data-source folders a
 * non-admin sees on the global data-sources page: those they own, hold a grant on, or that hold at
 * least one data source they may see. The last clause mirrors folder-apps, so a data source
 * reached by a direct grant lists under its folder instead of at the root.
 *
 * Pure: the service is constructed with null collaborators and the protected filter driven
 * directly, so nothing here touches the database.
 *
 * @group platform
 */
import { FolderDataSourcesService } from '../../../../src/modules/folder-data-sources/service';
import { User } from '../../../../src/entities/user.entity';
import { Folder } from '../../../../src/entities/folder.entity';
import { FolderDataSource } from '../../../../src/entities/folder_data_source.entity';
import { UserFolderPermissions } from '../../../../src/modules/ability/types';

class TestableFolderDataSourcesService extends FolderDataSourcesService {
  constructor() {
    super(null as any, null as any, null as any, null as any);
  }
  public exposeFilterFolders(
    folders: Folder[],
    user: User,
    isAdmin: boolean,
    folderPermissions?: UserFolderPermissions,
    dataSourcesByFolder?: Map<string, FolderDataSource[]>
  ): Folder[] {
    return this.filterFoldersByPermissions(folders, user, isAdmin, folderPermissions, dataSourcesByFolder);
  }
}

function makeUser(id = 'user-1'): User {
  return { id } as User;
}

function makeFolder(id: string, createdBy = 'other-user'): Folder {
  return { id, createdBy } as Folder;
}

// The caller hands the filter an already-permission-filtered membership map, so "has an entry
// here" means "holds at least one data source this user may see".
function visibleContents(...folderIds: string[]): Map<string, FolderDataSource[]> {
  return new Map(folderIds.map((id) => [id, [{} as FolderDataSource]]));
}

function makePermissions(overrides: Partial<UserFolderPermissions> = {}): UserFolderPermissions {
  return {
    isAllViewable: false,
    viewableFoldersId: [],
    isAllEditable: false,
    editableFoldersId: [],
    isAllEditApps: false,
    editAppsInFoldersId: [],
    ...overrides,
  } as UserFolderPermissions;
}

describe('FolderDataSourcesService.filterFoldersByPermissions', () => {
  let service: TestableFolderDataSourcesService;

  beforeEach(() => {
    service = new TestableFolderDataSourcesService();
  });

  describe('admin', () => {
    it('should return every folder regardless of contents or grants', () => {
      const folders = [makeFolder('f1'), makeFolder('f2')];
      const result = service.exposeFilterFolders(folders, makeUser(), true, undefined, visibleContents('f1'));
      expect(result.map((f) => f.id)).toEqual(['f1', 'f2']);
    });
  });

  describe('builder with no folder-permission object (CE / unconfigured EE)', () => {
    it('should fall back to showing every folder', () => {
      const folders = [makeFolder('f1'), makeFolder('f2')];
      const result = service.exposeFilterFolders(folders, makeUser(), false, undefined, new Map());
      expect(result.map((f) => f.id)).toEqual(['f1', 'f2']);
    });
  });

  describe('builder with blanket folder access', () => {
    it('should return every folder when isAllEditable', () => {
      const folders = [makeFolder('f1'), makeFolder('f2')];
      const perms = makePermissions({ isAllEditable: true });
      const result = service.exposeFilterFolders(folders, makeUser(), false, perms, new Map());
      expect(result.map((f) => f.id)).toEqual(['f1', 'f2']);
    });

    it('should return every folder when isAllViewable', () => {
      const folders = [makeFolder('f1'), makeFolder('f2')];
      const perms = makePermissions({ isAllViewable: true });
      const result = service.exposeFilterFolders(folders, makeUser(), false, perms, new Map());
      expect(result.map((f) => f.id)).toEqual(['f1', 'f2']);
    });
  });

  describe('builder with scoped grants', () => {
    it('should list a folder reached only through a direct data source grant', () => {
      // f1: no grant, but holds a data source the user may see → visible (the fix). Without it the
      // data source renders at the root as though it were unfoldered.
      // f2: no grant and nothing visible inside → still hidden.
      const folders = [makeFolder('f1'), makeFolder('f2')];
      const perms = makePermissions({ editableFoldersId: [], viewableFoldersId: [] });
      const result = service.exposeFilterFolders(folders, makeUser(), false, perms, visibleContents('f1'));
      expect(result.map((f) => f.id)).toEqual(['f1']);
    });

    it('should list a granted folder even when it holds nothing the user may see', () => {
      const folders = [makeFolder('f1'), makeFolder('f2')];
      const perms = makePermissions({ viewableFoldersId: ['f1'] });
      const result = service.exposeFilterFolders(folders, makeUser(), false, perms, new Map());
      expect(result.map((f) => f.id)).toEqual(['f1']);
    });

    it('should list a folder the user created even when it holds nothing they may see', () => {
      const folders = [makeFolder('f1', 'user-1'), makeFolder('f2')];
      const perms = makePermissions();
      const result = service.exposeFilterFolders(folders, makeUser('user-1'), false, perms, new Map());
      expect(result.map((f) => f.id)).toEqual(['f1']);
    });

    it('should still hide a folder with neither a grant, ownership, nor visible contents', () => {
      const folders = [makeFolder('f1'), makeFolder('f2'), makeFolder('f3')];
      const perms = makePermissions({ editableFoldersId: ['f1'] });
      const result = service.exposeFilterFolders(folders, makeUser(), false, perms, visibleContents('f2'));
      expect(result.map((f) => f.id)).toEqual(['f1', 'f2']);
    });
  });

  describe('missing membership map', () => {
    it('should not throw and should fall back to grants alone', () => {
      const folders = [makeFolder('f1'), makeFolder('f2')];
      const perms = makePermissions({ viewableFoldersId: ['f2'] });
      const result = service.exposeFilterFolders(folders, makeUser(), false, perms, undefined);
      expect(result.map((f) => f.id)).toEqual(['f2']);
    });
  });
});
