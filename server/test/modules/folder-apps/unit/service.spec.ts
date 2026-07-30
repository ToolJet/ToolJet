import { FolderAppsService } from '../../../../src/modules/folder-apps/service';
import { User } from '../../../../src/entities/user.entity';
import { USER_ROLE } from '../../../../src/modules/group-permissions/constants';
import { UserFolderPermissions } from '../../../../src/modules/ability/types';

class TestableFolderAppsService extends FolderAppsService {
  constructor() {
    super(null as any, null as any, null as any);
  }
  public exposeFilterFolders(
    folders: any[],
    user: User,
    isAdmin: boolean,
    folderPermissions: UserFolderPermissions
  ): any[] {
    return this.filterFoldersByPermissions(folders, user, isAdmin, folderPermissions);
  }
}

function makeUser(role: USER_ROLE, id = 'user-1'): User {
  return { id, roleGroup: role } as User;
}

function makeFolder(id: string, appCount: number, createdBy = 'other-user'): any {
  return { id, folderApps: Array(appCount).fill({}), createdBy };
}

describe('FolderAppsService.filterFoldersByPermissions', () => {
  let service: TestableFolderAppsService;

  beforeEach(() => {
    service = new TestableFolderAppsService();
  });

  describe('admin', () => {
    it('returns all folders regardless of app count', () => {
      const folders = [makeFolder('f1', 2), makeFolder('f2', 0), makeFolder('f3', 1)];
      const result = service.exposeFilterFolders(folders, makeUser(USER_ROLE.BUILDER), true, null);
      expect(result).toHaveLength(3);
    });
  });

  describe('end-user', () => {
    const user = makeUser(USER_ROLE.END_USER);

    it('no folderPermissions — shows only folders with accessible apps', () => {
      const folders = [makeFolder('f1', 2), makeFolder('f2', 0), makeFolder('f3', 1)];
      const result = service.exposeFilterFolders(folders, user, false, null);
      expect(result.map((f) => f.id)).toEqual(['f1', 'f3']);
    });

    it('isAllViewable — shows only folders with accessible apps', () => {
      const folders = [makeFolder('f1', 1), makeFolder('f2', 0)];
      const perms: UserFolderPermissions = {
        isAllViewable: true,
        viewableFoldersId: [],
        isAllEditable: false,
        editableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      };
      const result = service.exposeFilterFolders(folders, user, false, perms);
      expect(result.map((f) => f.id)).toEqual(['f1']);
    });

    it('explicit viewableFoldersId — shows folders with accessible apps even if not in list', () => {
      // f1 is in the explicit list but has no accessible apps → hidden (end-users never see empty)
      // f2 is NOT in the explicit list but has accessible apps → must be visible (the fix)
      // f3 is in the explicit list and has accessible apps → visible
      const folders = [makeFolder('f1', 0), makeFolder('f2', 1), makeFolder('f3', 1)];
      const perms: UserFolderPermissions = {
        isAllViewable: false,
        viewableFoldersId: ['f1', 'f3'],
        isAllEditable: false,
        editableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      };
      const result = service.exposeFilterFolders(folders, user, false, perms);
      expect(result.map((f) => f.id)).toEqual(['f2', 'f3']);
    });

    it('explicit viewableFoldersId — never shows empty folders', () => {
      const folders = [makeFolder('f1', 0), makeFolder('f2', 0)];
      const perms: UserFolderPermissions = {
        isAllViewable: false,
        viewableFoldersId: ['f1', 'f2'],
        isAllEditable: false,
        editableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      };
      const result = service.exposeFilterFolders(folders, user, false, perms);
      expect(result).toHaveLength(0);
    });
  });

  describe('builder', () => {
    const user = makeUser(USER_ROLE.BUILDER);

    it('no folderPermissions (CE) — shows all folders including empty', () => {
      const folders = [makeFolder('f1', 2), makeFolder('f2', 0)];
      const result = service.exposeFilterFolders(folders, user, false, null);
      expect(result).toHaveLength(2);
    });

    it('isAllEditable — shows all folders', () => {
      const folders = [makeFolder('f1', 2), makeFolder('f2', 0)];
      const perms: UserFolderPermissions = {
        isAllEditable: true,
        editableFoldersId: [],
        isAllViewable: false,
        viewableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      };
      const result = service.exposeFilterFolders(folders, user, false, perms);
      expect(result).toHaveLength(2);
    });

    it('explicit accessibleFolderIds — shows explicit folders (empty ok) AND app-surfaced folders', () => {
      // f1 is in accessibleFolderIds but empty → still visible (builder can manage empty folders)
      // f2 is NOT in accessibleFolderIds but has accessible apps → must be visible (the fix)
      // f3 is NOT in accessibleFolderIds and has no apps → hidden
      const folders = [makeFolder('f1', 0), makeFolder('f2', 1), makeFolder('f3', 0)];
      const perms: UserFolderPermissions = {
        isAllEditable: false,
        editableFoldersId: ['f1'],
        isAllViewable: false,
        viewableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      };
      const result = service.exposeFilterFolders(folders, user, false, perms);
      expect(result.map((f) => f.id)).toEqual(['f1', 'f2']);
    });

    it('explicit accessibleFolderIds — folder created by user always visible', () => {
      const folders = [makeFolder('f1', 0, user.id)];
      const perms: UserFolderPermissions = {
        isAllEditable: false,
        editableFoldersId: [],
        isAllViewable: false,
        viewableFoldersId: [],
        isAllEditApps: false,
        editAppsInFoldersId: [],
      };
      const result = service.exposeFilterFolders(folders, user, false, perms);
      expect(result.map((f) => f.id)).toEqual(['f1']);
    });
  });
});
