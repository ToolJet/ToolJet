import { UserPermissions } from '@modules/ability/types';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { SqlParams } from '@modules/apps/dashboard/sql-params';
import {
  appActions,
  folderActions,
  folderVisibilityPredicate,
  likePattern,
  resolveFolderAccess,
} from '@modules/apps/dashboard/actions';

const appPerms = (over: Record<string, unknown> = {}) => ({
  editableAppsId: [],
  isAllEditable: false,
  viewableAppsId: [],
  isAllViewable: true,
  hiddenAppsId: [],
  hideAll: false,
  ownedAppsId: [],
  environmentAccess: { development: false, staging: false, production: false, released: true },
  ...over,
});

const perms = (over: Partial<UserPermissions> = {}): UserPermissions =>
  ({
    isAdmin: false,
    isSuperAdmin: false,
    isBuilder: false,
    isEndUser: true,
    appCreate: false,
    appDelete: false,
    workflowCreate: false,
    workflowDelete: false,
    folderCreate: false,
    folderDelete: false,
    workflowFolderCreate: false,
    workflowFolderDelete: false,
    [MODULES.APP]: appPerms(),
    ...over,
  }) as UserPermissions;

const app = { id: 'a1', ownerId: 'owner', folderId: null, currentVersionId: 'v1', isMaintenanceOn: false };

describe('dashboard actions', () => {
  describe('appActions | launch', () => {
    it('should block unreleased, then maintenance, then builder without released access — first match wins', () => {
      const builder = perms({
        isEndUser: false,
        isBuilder: true,
        [MODULES.APP]: appPerms({ environmentAccess: { released: false } }),
      });
      expect(
        appActions(builder, APP_TYPES.FRONT_END, 'u', { ...app, currentVersionId: null, isMaintenanceOn: true }).launch
      ).toEqual({
        enabled: false,
        reason: 'not_released',
      });
      expect(appActions(builder, APP_TYPES.FRONT_END, 'u', { ...app, isMaintenanceOn: true }).launch).toEqual({
        enabled: false,
        reason: 'maintenance',
      });
      expect(appActions(builder, APP_TYPES.FRONT_END, 'u', app).launch).toEqual({
        enabled: false,
        reason: 'no_released_access',
      });
    });

    it('should never give no_released_access to end users and give workflows no launch', () => {
      const endUser = perms({ [MODULES.APP]: appPerms({ environmentAccess: { released: false } }) });
      expect(appActions(endUser, APP_TYPES.FRONT_END, 'u', app).launch).toEqual({ enabled: true, reason: null });
      expect(appActions(perms({ isAdmin: true }), APP_TYPES.WORKFLOW, 'u', app).launch).toBeNull();
      expect(appActions(perms({ isAdmin: true }), APP_TYPES.MODULE, 'u', app).launch).toBeNull();
    });
  });

  describe('appActions | edit / delete', () => {
    it('should let an end user only pin, workflows included', () => {
      expect(appActions(perms(), APP_TYPES.FRONT_END, 'u', app)).toMatchObject({
        edit: false,
        delete: false,
        pin: true,
      });
      expect(appActions(perms(), APP_TYPES.WORKFLOW, 'u', app)).toEqual({
        launch: null,
        edit: false,
        delete: false,
        pin: true,
      });
    });

    it('should grant delete to the owner of an editable app without appDelete', () => {
      const builder = perms({ isEndUser: false, isBuilder: true, [MODULES.APP]: appPerms({ editableAppsId: ['a1'] }) });
      expect(appActions(builder, APP_TYPES.FRONT_END, 'owner', app)).toMatchObject({ edit: true, delete: true });
      expect(appActions(builder, APP_TYPES.FRONT_END, 'someone-else', app)).toMatchObject({
        edit: true,
        delete: false,
      });
    });

    it('should grant edit (not delete) through a folder-level edit-apps grant', () => {
      const builder = perms({
        isEndUser: false,
        isBuilder: true,
        [MODULES.FOLDER]: {
          editableFoldersId: [],
          isAllEditable: false,
          viewableFoldersId: [],
          isAllViewable: false,
          editAppsInFoldersId: ['f1'],
          isAllEditApps: false,
        },
      });
      expect(appActions(builder, APP_TYPES.FRONT_END, 'u', { ...app, folderId: 'f1' })).toMatchObject({
        edit: true,
        delete: false,
      });
    });

    it('should require workflowDelete for workflow delete even when editable', () => {
      const builder = perms({
        isEndUser: false,
        isBuilder: true,
        [MODULES.WORKFLOWS]: {
          editableWorkflowsId: ['a1'],
          isAllEditable: false,
          executableWorkflowsId: [],
          isAllExecutable: false,
        },
      });
      expect(appActions(builder, APP_TYPES.WORKFLOW, 'owner', app)).toMatchObject({ edit: true, delete: false });
      expect(appActions({ ...builder, workflowDelete: true }, APP_TYPES.WORKFLOW, 'u', app)).toMatchObject({
        delete: true,
      });
    });
  });

  describe('folderActions', () => {
    const noGit = { enabled: false, multiBranch: false, onDefaultBranch: true };
    const folder = { id: 'f1', ownerId: 'owner', appCount: 2 };
    const builder = perms({ isEndUser: false, isBuilder: true });

    it('should let the owner rename and delete, and others only with grants', () => {
      expect(folderActions(builder, APP_TYPES.FRONT_END, 'owner', folder, noGit)).toEqual({
        rename: true,
        delete: true,
        pin: true,
      });
      expect(folderActions(builder, APP_TYPES.FRONT_END, 'u', folder, noGit)).toEqual({
        rename: false,
        delete: false,
        pin: true,
      });
      expect(
        folderActions({ ...builder, workflowFolderDelete: true }, APP_TYPES.WORKFLOW, 'u', folder, noGit)
      ).toMatchObject({ delete: true });
    });

    it('should block rename on every branch in multi-branch mode', () => {
      const featureBranch = { enabled: true, multiBranch: true, onDefaultBranch: false };
      expect(folderActions(builder, APP_TYPES.FRONT_END, 'owner', folder, featureBranch)).toMatchObject({
        rename: false,
      });
      expect(
        folderActions(builder, APP_TYPES.FRONT_END, 'owner', folder, { ...featureBranch, multiBranch: false })
      ).toMatchObject({ rename: true });
    });

    it('should block delete on the locked default branch for apps and modules, not workflows', () => {
      const locked = { enabled: true, multiBranch: true, onDefaultBranch: true };
      const empty = { ...folder, appCount: 0 };
      expect(folderActions(builder, APP_TYPES.FRONT_END, 'owner', empty, locked)).toMatchObject({ delete: false });
      expect(folderActions(builder, APP_TYPES.MODULE, 'owner', empty, locked)).toMatchObject({ delete: false });
      expect(folderActions(builder, APP_TYPES.WORKFLOW, 'owner', empty, locked)).toMatchObject({ delete: true });
      expect(
        folderActions(builder, APP_TYPES.FRONT_END, 'owner', empty, { ...locked, onDefaultBranch: false })
      ).toMatchObject({ delete: true });
    });

    it('should block delete of a non-empty folder whenever git sync is on', () => {
      const singleBranch = { enabled: true, multiBranch: false, onDefaultBranch: true };
      expect(folderActions(builder, APP_TYPES.FRONT_END, 'owner', folder, singleBranch)).toMatchObject({
        delete: false,
      });
      expect(
        folderActions(builder, APP_TYPES.FRONT_END, 'owner', { ...folder, appCount: 0 }, singleBranch)
      ).toMatchObject({ delete: true });
    });
  });

  describe('resolveFolderAccess + folderVisibilityPredicate', () => {
    it('should show admins everything, end users only folders with visible apps, scoped builders grants + own + non-empty', () => {
      const params = new SqlParams();
      expect(
        folderVisibilityPredicate(
          resolveFolderAccess(perms({ isAdmin: true, isEndUser: false }), APP_TYPES.FRONT_END, 'u'),
          'fs',
          params
        )
      ).toBe('TRUE');
      expect(folderVisibilityPredicate(resolveFolderAccess(perms(), APP_TYPES.FRONT_END, 'u'), 'fs', params)).toBe(
        'fs.app_count > 0'
      );
      const scoped = perms({
        isEndUser: false,
        isBuilder: true,
        [MODULES.FOLDER]: {
          editableFoldersId: ['f1'],
          isAllEditable: false,
          viewableFoldersId: ['f2'],
          isAllViewable: false,
          editAppsInFoldersId: [],
          isAllEditApps: false,
        },
      });
      expect(folderVisibilityPredicate(resolveFolderAccess(scoped, APP_TYPES.FRONT_END, 'u'), 'fs', params)).toBe(
        '(fs.id = ANY($1::uuid[]) OR fs.owner_id = $2 OR fs.app_count > 0)'
      );
      expect(params.values).toEqual([['f1', 'f2'], 'u']);
    });
  });

  describe('likePattern', () => {
    it('should escape LIKE metacharacters', () => {
      expect(likePattern('50%_a\\b')).toBe('%50\\%\\_a\\\\b%');
    });
  });
});
