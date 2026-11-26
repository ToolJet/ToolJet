/// <reference types="jest" />
import { FeatureAbilityFactory, FeatureAbility } from '@modules/folder-apps/ability/index';
import { FEATURE_KEY } from '@modules/folder-apps/constants';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { FolderApp } from '@entities/folder_app.entity';
import { buildAbilityViaFactory, expectFeatures } from 'test-helper';

const MUTATE_ACTIONS = [FEATURE_KEY.CREATE_FOLDER_APP, FEATURE_KEY.DELETE_FOLDER_APP];
const factory = new FeatureAbilityFactory(null as any);

const build = (permissions: any, request: Record<string, unknown> = {}, features: string[] = []) =>
  buildAbilityViaFactory<FeatureAbility>(factory, permissions, { moduleName: '', features }, request);

/** @group platform */
describe('folder-apps FeatureAbilityFactory', () => {
  describe('folder/app type mismatch short-circuit', () => {
    it('denies everything, including GET_FOLDERS, when tj_folder_app_type_mismatch is set', async () => {
      const ability = await build({ isAdmin: true }, { tj_folder_app_type_mismatch: true });
      expectFeatures(ability, FolderApp, { denied: [...MUTATE_ACTIONS, FEATURE_KEY.GET_FOLDERS] });
    });
  });

  describe('GET_FOLDERS baseline', () => {
    it('grants GET_FOLDERS unconditionally, even with zero permissions', async () => {
      const ability = await build({});
      expect(ability.can(FEATURE_KEY.GET_FOLDERS, FolderApp)).toBe(true);
    });
  });

  describe('admin / superAdmin bypass', () => {
    it('grants CREATE_FOLDER_APP and DELETE_FOLDER_APP to isAdmin', async () => {
      const ability = await build({ isAdmin: true });
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });

    it('grants CREATE_FOLDER_APP and DELETE_FOLDER_APP to superAdmin', async () => {
      const ability = await build({ superAdmin: true });
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });
  });

  describe('no permissions at all', () => {
    it('denies both mutating actions', async () => {
      const ability = await build({});
      expectFeatures(ability, FolderApp, { denied: MUTATE_ACTIONS });
    });
  });

  describe('owner bulk add — requires edit access on every target app', () => {
    const bulk = (ids: string[], type = APP_TYPES.FRONT_END, owned: string[] = []) => ({
      tj_allow_owner_folder_app_create: true,
      tj_folder_add_app_ids: ids,
      tj_folder_add_owned_app_ids: owned,
      tj_folder_type: type,
    });
    const features = [FEATURE_KEY.CREATE_FOLDER_APP];

    it('denies when the caller has only view access on one of the apps', async () => {
      const ability = await build(
        { userPermission: { [MODULES.APP]: { editableAppsId: ['app-1'], isAllEditable: false } } },
        bulk(['app-1', 'app-view-only']),
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(false);
    });

    it('allows when every app is individually editable', async () => {
      const ability = await build(
        { userPermission: { [MODULES.APP]: { editableAppsId: ['app-1', 'app-2'], isAllEditable: false } } },
        bulk(['app-1', 'app-2']),
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('allows when the caller can edit all apps', async () => {
      const ability = await build(
        { userPermission: { [MODULES.APP]: { editableAppsId: [], isAllEditable: true } } },
        bulk(['app-1']),
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('allows apps the caller owns even when not in the editable list', async () => {
      const ability = await build(
        { userPermission: { [MODULES.APP]: { editableAppsId: [], isAllEditable: false } } },
        bulk(['app-1'], APP_TYPES.FRONT_END, ['app-1']),
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('requires edit on the apps the caller does not own when the list is mixed', async () => {
      const ability = await build(
        { userPermission: { [MODULES.APP]: { editableAppsId: [], isAllEditable: false } } },
        bulk(['mine', 'theirs'], APP_TYPES.FRONT_END, ['mine']),
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(false);
    });

    it('allows owned module apps even though the module bucket has no owned list', async () => {
      const ability = await build({}, bulk(['m-1'], APP_TYPES.MODULE, ['m-1']), features);
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('checks the workflow bucket for workflow folders', async () => {
      const ability = await build(
        { userPermission: { [MODULES.WORKFLOWS]: { editableWorkflowsId: ['wf-1'], isAllEditable: false } } },
        bulk(['wf-1', 'wf-2'], APP_TYPES.WORKFLOW),
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(false);
    });

    it('denies folder-granular all-folder edit adding an app the caller can only view', async () => {
      const ability = await build(
        {
          userPermission: {
            [MODULES.APP]: { editableAppsId: [], isAllEditable: false },
            [MODULES.FOLDER]: { isAllEditable: true },
          },
        },
        {
          tj_folder_add_app_ids: ['app-view-only'],
          tj_folder_add_owned_app_ids: [],
          tj_folder_type: APP_TYPES.FRONT_END,
        },
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(false);
    });

    it('denies the coarse folder-create flag adding an app the caller can only view', async () => {
      const ability = await build(
        { userPermission: { folderCreate: true, [MODULES.APP]: { editableAppsId: [], isAllEditable: false } } },
        {
          tj_folder_add_app_ids: ['app-view-only'],
          tj_folder_add_owned_app_ids: [],
          tj_folder_type: APP_TYPES.FRONT_END,
        },
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(false);
    });

    it('lets folder-granular all-folder edit add an app the caller can edit', async () => {
      const ability = await build(
        {
          userPermission: {
            [MODULES.APP]: { editableAppsId: ['app-1'], isAllEditable: false },
            [MODULES.FOLDER]: { isAllEditable: true },
          },
        },
        { tj_folder_add_app_ids: ['app-1'], tj_folder_add_owned_app_ids: [], tj_folder_type: APP_TYPES.FRONT_END },
        features
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('does not take away removing an app from a folder the caller manages', async () => {
      const ability = await build(
        {
          userPermission: {
            [MODULES.APP]: { editableAppsId: [], isAllEditable: false },
            [MODULES.FOLDER]: { isAllEditable: true },
          },
        },
        {
          tj_folder_add_app_ids: ['app-view-only'],
          tj_folder_add_owned_app_ids: [],
          tj_folder_type: APP_TYPES.FRONT_END,
        },
        [FEATURE_KEY.DELETE_FOLDER_APP]
      );
      expect(ability.can(FEATURE_KEY.DELETE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('still lets admins bulk add regardless of app access', async () => {
      const ability = await build({ isAdmin: true }, bulk(['app-x']), features);
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
    });
  });

  describe('owner create/delete flags — gated by both the request flag AND the feature metadata', () => {
    it('grants CREATE_FOLDER_APP when tj_allow_owner_folder_app_create is set and the feature is in scope', async () => {
      const ability = await build({}, { tj_allow_owner_folder_app_create: true }, [FEATURE_KEY.CREATE_FOLDER_APP]);
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('does not grant CREATE_FOLDER_APP when the owner flag is set but the feature metadata does not include it', async () => {
      const ability = await build({}, { tj_allow_owner_folder_app_create: true }, [FEATURE_KEY.DELETE_FOLDER_APP]);
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(false);
    });

    it('grants DELETE_FOLDER_APP when tj_allow_owner_folder_app_delete is set and the feature is in scope', async () => {
      const ability = await build({}, { tj_allow_owner_folder_app_delete: true }, [FEATURE_KEY.DELETE_FOLDER_APP]);
      expect(ability.can(FEATURE_KEY.DELETE_FOLDER_APP, FolderApp)).toBe(true);
    });

    it('does not grant DELETE_FOLDER_APP when the owner flag is set but the feature metadata does not include it', async () => {
      const ability = await build({}, { tj_allow_owner_folder_app_delete: true }, [FEATURE_KEY.CREATE_FOLDER_APP]);
      expect(ability.can(FEATURE_KEY.DELETE_FOLDER_APP, FolderApp)).toBe(false);
    });
  });

  describe('granular folder permissions — resolved per folder type (default / workflow / module)', () => {
    it('grants both mutating actions on a default folder when isAllEditable is true', async () => {
      const ability = await build({ userPermission: { [MODULES.FOLDER]: { isAllEditable: true } } as any });
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });

    it('grants both mutating actions when the folder id is in editableFoldersId', async () => {
      const ability = await build(
        { userPermission: { [MODULES.FOLDER]: { editableFoldersId: ['folder-1'] } } as any },
        { tj_resource_id: 'folder-1' }
      );
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });

    it('denies both mutating actions when the folder id is not in editableFoldersId', async () => {
      const ability = await build(
        { userPermission: { [MODULES.FOLDER]: { editableFoldersId: ['other-folder'] } } as any },
        { tj_resource_id: 'folder-1' }
      );
      expectFeatures(ability, FolderApp, { denied: MUTATE_ACTIONS });
    });

    it('resolves against WORKFLOW_FOLDER permissions when tj_folder_type is workflow', async () => {
      const ability = await build(
        { userPermission: { [MODULES.WORKFLOW_FOLDER]: { isAllEditable: true } } as any },
        { tj_folder_type: APP_TYPES.WORKFLOW }
      );
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });

    it('resolves against MODULE_FOLDER permissions when tj_folder_type is module', async () => {
      const ability = await build(
        { userPermission: { [MODULES.MODULE_FOLDER]: { isAllEditable: true } } as any },
        { tj_folder_type: APP_TYPES.MODULE }
      );
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });

    it('does NOT fall back to the plain folderCreate flag when a folder-type permission object exists but does not match', async () => {
      // If folderPermissions is present (even if none of its fields grant access), the `else if (folderCreate)`
      // fallback is skipped entirely — folderCreate only applies when there is no permission object at all.
      const ability = await build({
        userPermission: {
          folderCreate: true,
          [MODULES.FOLDER]: { isAllEditable: false, editableFoldersId: [] },
        } as any,
      });
      expectFeatures(ability, FolderApp, { denied: MUTATE_ACTIONS });
    });
  });

  describe('folderCreate fallback — only when no folder-type permission object exists at all', () => {
    it('grants both mutating actions from the plain folderCreate flag when there is no resolved folder-permission object', async () => {
      const ability = await build({ userPermission: { folderCreate: true } as any });
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });
  });
});
