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

  describe('module-builder bypass — requires BOTH tj_app_is_module AND userPermission.isBuilder', () => {
    it('grants both mutating actions when the folder-app is a module and userPermission.isBuilder is true', async () => {
      const ability = await build({ userPermission: { isBuilder: true } as any }, { tj_app_is_module: true });
      expectFeatures(ability, FolderApp, { allowed: MUTATE_ACTIONS });
    });

    it('denies both when tj_app_is_module is true but userPermission.isBuilder is false', async () => {
      const ability = await build({ userPermission: { isBuilder: false } as any }, { tj_app_is_module: true });
      expectFeatures(ability, FolderApp, { denied: MUTATE_ACTIONS });
    });

    it('denies both when userPermission.isBuilder is true but tj_app_is_module is false', async () => {
      // Note: reads userPermission.isBuilder specifically, not the top-level UserAllPermissions.isBuilder flag —
      // in production both are always populated from the same resolved value, but a unit test targeting this
      // function must set userPermission.isBuilder, not just the top-level flag, to exercise this branch.
      const ability = await build(
        { isBuilder: true, userPermission: { isBuilder: false } as any },
        { tj_app_is_module: false }
      );
      expectFeatures(ability, FolderApp, { denied: MUTATE_ACTIONS });
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
