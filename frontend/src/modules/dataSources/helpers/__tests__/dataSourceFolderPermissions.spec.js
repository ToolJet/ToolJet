import {
  canCreateDataSourceFolder,
  canDeleteDataSourceFolder,
  canRenameDataSourceFolder,
} from '../dataSourceFolderPermissions';

const FOLDER = { id: 'folder-a', name: 'Folder A', created_by: 'someone-else' };

const session = (overrides = {}) => ({
  super_admin: false,
  admin: false,
  current_user: { id: 'builder-1' },
  user_permissions: { data_source_folder_create: false, data_source_folder_delete: false },
  data_source_folder_group_permissions: { is_all_editable: false, editable_folders_id: [] },
  ...overrides,
});

describe('canRenameDataSourceFolder', () => {
  it('should allow a scoped "Edit folder" grant on the granted folder', () => {
    const s = session({
      data_source_folder_group_permissions: { is_all_editable: false, editable_folders_id: ['folder-a'] },
    });
    expect(canRenameDataSourceFolder(s, FOLDER)).toBe(true);
  });

  it('should deny a scoped grant on a folder outside it', () => {
    const s = session({
      data_source_folder_group_permissions: { is_all_editable: false, editable_folders_id: ['folder-b'] },
    });
    expect(canRenameDataSourceFolder(s, FOLDER)).toBe(false);
  });

  it('should allow an all-folders "Edit folder" grant', () => {
    const s = session({
      data_source_folder_group_permissions: { is_all_editable: true, editable_folders_id: [] },
    });
    expect(canRenameDataSourceFolder(s, FOLDER)).toBe(true);
  });

  it('should allow the folder creator even with no grant at all', () => {
    const s = session();
    expect(canRenameDataSourceFolder(s, { ...FOLDER, created_by: 'builder-1' })).toBe(true);
  });

  it('should allow admins and super admins', () => {
    expect(canRenameDataSourceFolder(session({ admin: true }), FOLDER)).toBe(true);
    expect(canRenameDataSourceFolder(session({ super_admin: true }), FOLDER)).toBe(true);
  });

  // The server accepts the coarse create flag for CREATE and DELETE, never for UPDATE
  // (FoldersService.checkFolderManagePermission). Honouring it here would offer a Rename that 403s.
  it('should NOT allow the coarse create flag to stand in for a per-folder grant', () => {
    const s = session({
      user_permissions: { data_source_folder_create: true, data_source_folder_delete: true },
    });
    expect(canRenameDataSourceFolder(s, FOLDER)).toBe(false);
  });

  it('should deny renaming while multi-branch git sync is on, which the server rejects', () => {
    const s = session({
      data_source_folder_group_permissions: { is_all_editable: true, editable_folders_id: [] },
    });
    expect(canRenameDataSourceFolder(s, FOLDER, { isBranchingEnabled: true })).toBe(false);
    // Admins are not exempt — the server's git-sync check runs after its permission check.
    expect(canRenameDataSourceFolder(session({ admin: true }), FOLDER, { isBranchingEnabled: true })).toBe(false);
  });

  it('should deny when the session or folder is missing', () => {
    expect(canRenameDataSourceFolder(null, FOLDER)).toBe(false);
    expect(canRenameDataSourceFolder(session({ admin: true }), undefined)).toBe(false);
  });

  // CE, and EE workspaces whose group predates the feature, carry no granular bucket at all.
  it('should fall back to the coarse create flag only when no granular bucket exists', () => {
    const noBucket = session({ data_source_folder_group_permissions: null });
    expect(canRenameDataSourceFolder(noBucket, FOLDER)).toBe(false);

    const noBucketWithCreate = session({
      data_source_folder_group_permissions: null,
      user_permissions: { data_source_folder_create: true },
    });
    expect(canRenameDataSourceFolder(noBucketWithCreate, FOLDER)).toBe(true);
  });
});

describe('canCreateDataSourceFolder', () => {
  it('should follow the coarse create flag', () => {
    expect(canCreateDataSourceFolder(session())).toBe(false);
    expect(canCreateDataSourceFolder(session({ user_permissions: { data_source_folder_create: true } }))).toBe(true);
    expect(canCreateDataSourceFolder(session({ admin: true }))).toBe(true);
    expect(canCreateDataSourceFolder(null)).toBe(false);
  });
});

describe('canDeleteDataSourceFolder', () => {
  it('should follow the coarse delete flag', () => {
    expect(canDeleteDataSourceFolder(session())).toBe(false);
    expect(canDeleteDataSourceFolder(session({ user_permissions: { data_source_folder_delete: true } }))).toBe(true);
    expect(canDeleteDataSourceFolder(session({ super_admin: true }))).toBe(true);
    expect(canDeleteDataSourceFolder(null)).toBe(false);
  });
});
