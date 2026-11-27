import { UserDataSourcePermissions, UserFolderPermissions, UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { SqlParams } from '@modules/apps/dashboard/sql-params';
import {
  canDeleteDataSource,
  canEditDataSource,
  dataSourceActions,
  folderActions,
  folderVisibilityPredicate,
  isEditCapable,
  resolveFolderAccess,
  visibleDataSourceIds,
} from '@modules/data-sources/dashboard/actions';

const dataSourcePerms = (over: Partial<UserDataSourcePermissions> = {}): UserDataSourcePermissions => ({
  usableDataSourcesId: [],
  isAllUsable: false,
  configurableDataSourceId: [],
  isAllConfigurable: false,
  ...over,
});

const folderPerms = (over: Partial<UserFolderPermissions> = {}): UserFolderPermissions => ({
  editableFoldersId: [],
  isAllEditable: false,
  viewableFoldersId: [],
  isAllViewable: false,
  editAppsInFoldersId: [],
  isAllEditApps: false,
  ...over,
});

const perms = (over: Partial<UserPermissions> = {}): UserPermissions =>
  ({
    isAdmin: false,
    isSuperAdmin: false,
    isBuilder: false,
    isEndUser: true,
    dataSourceCreate: false,
    dataSourceDelete: false,
    dataSourceFolderCreate: false,
    dataSourceFolderDelete: false,
    [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms(),
    [MODULES.DATA_SOURCE_FOLDER]: folderPerms(),
    ...over,
  }) as UserPermissions;

const folder = { id: 'f1', ownerId: 'owner', hasDataSourcesOnAnyBranch: false };
const gitOff = { enabled: false, multiBranch: false };
const multiBranch = { enabled: true, multiBranch: true };

describe('data sources dashboard actions', () => {
  describe('visibleDataSourceIds | allGlobalDS parity', () => {
    it('should see every data source as admin, super admin, with all-use / all-configure or create / delete', () => {
      for (const p of [
        perms({ isAdmin: true }),
        perms({ isSuperAdmin: true }),
        perms({ [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({ isAllUsable: true }) }),
        perms({ [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({ isAllConfigurable: true }) }),
        perms({ dataSourceCreate: true }),
        perms({ dataSourceDelete: true }),
      ]) {
        expect(visibleDataSourceIds(p)).toBeNull();
      }
    });

    it('should see only the union of use and configure grants otherwise', () => {
      const p = perms({
        [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({
          usableDataSourcesId: ['a', 'b'],
          configurableDataSourceId: ['b', 'c'],
        }),
      });
      expect(visibleDataSourceIds(p)).toEqual(['a', 'b', 'c']);
    });

    it('should see none with no grants or no data source permission object', () => {
      expect(visibleDataSourceIds(perms())).toEqual([]);
      expect(visibleDataSourceIds(perms({ [MODULES.GLOBAL_DATA_SOURCE]: undefined }))).toEqual([]);
    });
  });

  describe('canEditDataSource / canDeleteDataSource / isEditCapable', () => {
    it('should allow edit for admin, create, all-configure or the configured id only', () => {
      const configureOne = perms({
        [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({ configurableDataSourceId: ['a'], usableDataSourcesId: ['b'] }),
      });
      expect(canEditDataSource(perms({ isAdmin: true }), 'x')).toBe(true);
      expect(canEditDataSource(perms({ dataSourceCreate: true }), 'x')).toBe(true);
      expect(
        canEditDataSource(perms({ [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({ isAllConfigurable: true }) }), 'x')
      ).toBe(true);
      expect(canEditDataSource(configureOne, 'a')).toBe(true);
      expect(canEditDataSource(configureOne, 'b')).toBe(false);
      expect(canEditDataSource(perms({ dataSourceDelete: true }), 'x')).toBe(false);
    });

    it('should allow delete only for admin or the delete permission', () => {
      expect(canDeleteDataSource(perms({ isSuperAdmin: true }))).toBe(true);
      expect(canDeleteDataSource(perms({ dataSourceDelete: true }))).toBe(true);
      expect(canDeleteDataSource(perms({ dataSourceCreate: true }))).toBe(false);
    });

    it('should treat a user with any configure grant as edit-capable, a use-only user as not', () => {
      expect(isEditCapable(perms({ isAdmin: true }))).toBe(true);
      expect(isEditCapable(perms({ dataSourceCreate: true }))).toBe(true);
      expect(isEditCapable(perms({ [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({ isAllConfigurable: true }) }))).toBe(
        true
      );
      expect(
        isEditCapable(perms({ [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({ configurableDataSourceId: ['a'] }) }))
      ).toBe(true);
      expect(isEditCapable(perms({ [MODULES.GLOBAL_DATA_SOURCE]: dataSourcePerms({ isAllUsable: true }) }))).toBe(
        false
      );
      expect(isEditCapable(perms({ dataSourceDelete: true }))).toBe(false);
    });

    it('should always offer pin', () => {
      expect(dataSourceActions(perms(), 'a', 'default')).toEqual({ edit: false, delete: false, pin: true });
    });
  });

  describe('folderActions', () => {
    it('should allow rename for admin, owner or an editable folder grant, delete for admin, owner or folder delete', () => {
      expect(folderActions(perms({ isAdmin: true }), 'u', folder, gitOff)).toEqual({
        rename: true,
        delete: true,
        pin: true,
      });
      expect(folderActions(perms(), 'owner', folder, gitOff)).toEqual({ rename: true, delete: true, pin: true });
      expect(
        folderActions(
          perms({ [MODULES.DATA_SOURCE_FOLDER]: folderPerms({ editableFoldersId: ['f1'] }) }),
          'u',
          folder,
          gitOff
        )
      ).toEqual({ rename: true, delete: false, pin: true });
      expect(
        folderActions(
          perms({ [MODULES.DATA_SOURCE_FOLDER]: folderPerms({ isAllEditable: true }) }),
          'u',
          folder,
          gitOff
        )
      ).toMatchObject({ rename: true });
      expect(folderActions(perms({ dataSourceFolderDelete: true }), 'u', folder, gitOff)).toEqual({
        rename: false,
        delete: true,
        pin: true,
      });
      expect(folderActions(perms(), 'u', folder, gitOff)).toEqual({ rename: false, delete: false, pin: true });
    });

    it('should block rename in multi-branch mode, and delete only while the folder holds data sources on any branch', () => {
      const admin = perms({ isAdmin: true });
      expect(folderActions(admin, 'u', folder, multiBranch)).toEqual({ rename: false, delete: true, pin: true });
      expect(folderActions(admin, 'u', { ...folder, hasDataSourcesOnAnyBranch: true }, multiBranch)).toEqual({
        rename: false,
        delete: false,
        pin: true,
      });
      expect(
        folderActions(admin, 'u', { ...folder, hasDataSourcesOnAnyBranch: true }, { enabled: true, multiBranch: false })
      ).toEqual({ rename: true, delete: true, pin: true });
    });
  });

  describe('resolveFolderAccess / folderVisibilityPredicate', () => {
    it('should give all folders to admins, all-edit / all-view grants and a missing folder permission object', () => {
      expect(resolveFolderAccess(perms({ isAdmin: true }), 'u')).toEqual({ kind: 'all' });
      expect(
        resolveFolderAccess(perms({ [MODULES.DATA_SOURCE_FOLDER]: folderPerms({ isAllViewable: true }) }), 'u')
      ).toEqual({ kind: 'all' });
      expect(
        resolveFolderAccess(perms({ [MODULES.DATA_SOURCE_FOLDER]: folderPerms({ isAllEditable: true }) }), 'u')
      ).toEqual({ kind: 'all' });
      expect(resolveFolderAccess(perms({ [MODULES.DATA_SOURCE_FOLDER]: undefined }), 'u')).toEqual({ kind: 'all' });
    });

    it('should otherwise grant editable ∪ viewable folders, owned folders and folders holding a visible data source', () => {
      const access = resolveFolderAccess(
        perms({
          [MODULES.DATA_SOURCE_FOLDER]: folderPerms({ editableFoldersId: ['a'], viewableFoldersId: ['a', 'b'] }),
        }),
        'u'
      );
      expect(access).toEqual({ kind: 'granted', folderIds: ['a', 'b'], userId: 'u' });

      const params = new SqlParams();
      expect(folderVisibilityPredicate(access, 'fs', params)).toBe(
        '(fs.id = ANY($1::uuid[]) OR fs.owner_id = $2 OR fs.data_source_count > 0)'
      );
      expect(params.values).toEqual([['a', 'b'], 'u']);
      expect(folderVisibilityPredicate({ kind: 'all' }, 'fs', new SqlParams())).toBe('TRUE');
    });
  });
});
