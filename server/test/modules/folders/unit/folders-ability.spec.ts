/// <reference types="jest" />
import { FeatureAbilityFactory, FeatureAbility } from '@modules/folders/ability/index';
import { FEATURE_KEY } from '@modules/folders/constants';
import { APP_TYPES } from '@modules/apps/constants';
import { Folder } from '@entities/folder.entity';
import { buildAbilityViaFactory, expectFeatures } from 'test-helper';

const ALL_ACTIONS = [FEATURE_KEY.CREATE_FOLDER, FEATURE_KEY.DELETE_FOLDER, FEATURE_KEY.UPDATE_FOLDER];

const factory = new FeatureAbilityFactory(null as any);

const build = (permissions: any, request: Record<string, unknown> = {}) =>
  buildAbilityViaFactory<FeatureAbility>(factory, permissions, undefined, request);

/** @group platform */
describe('folders FeatureAbilityFactory', () => {
  describe('admin / superAdmin bypass', () => {
    it('grants CREATE/DELETE/UPDATE regardless of any other permission', async () => {
      const ability = await build({ isAdmin: true, userPermission: { folderCreate: false, folderDelete: false } });
      expectFeatures(ability, Folder, { allowed: ALL_ACTIONS });
    });

    it('grants CREATE/DELETE/UPDATE for superAdmin', async () => {
      const ability = await build({ superAdmin: true });
      expectFeatures(ability, Folder, { allowed: ALL_ACTIONS });
    });
  });

  describe('default folder type — generic folderCreate/folderDelete', () => {
    it('denies everything with no permissions and no owner flag', async () => {
      const ability = await build({});
      expectFeatures(ability, Folder, { denied: ALL_ACTIONS });
    });

    it('grants CREATE_FOLDER and UPDATE_FOLDER when folderCreate is true', async () => {
      const ability = await build({ userPermission: { folderCreate: true } as any });
      expectFeatures(ability, Folder, {
        allowed: [FEATURE_KEY.CREATE_FOLDER, FEATURE_KEY.UPDATE_FOLDER],
        denied: [FEATURE_KEY.DELETE_FOLDER],
      });
    });

    it('grants DELETE_FOLDER when folderDelete is true', async () => {
      const ability = await build({ userPermission: { folderDelete: true } as any });
      expectFeatures(ability, Folder, { allowed: [FEATURE_KEY.DELETE_FOLDER], denied: [FEATURE_KEY.CREATE_FOLDER] });
    });

    it('grants only UPDATE_FOLDER to a plain builder with no create/delete permission', async () => {
      const ability = await build({ isBuilder: true });
      expectFeatures(ability, Folder, {
        allowed: [FEATURE_KEY.UPDATE_FOLDER],
        denied: [FEATURE_KEY.CREATE_FOLDER, FEATURE_KEY.DELETE_FOLDER],
      });
    });

    it('grants UPDATE_FOLDER and DELETE_FOLDER to the folder owner via tj_allow_owner_folder_manage, even without any permission flags', async () => {
      const ability = await build({}, { tj_allow_owner_folder_manage: true });
      expectFeatures(ability, Folder, {
        allowed: [FEATURE_KEY.UPDATE_FOLDER, FEATURE_KEY.DELETE_FOLDER],
        denied: [FEATURE_KEY.CREATE_FOLDER],
      });
    });
  });

  describe('workflow-folder type — workflowFolderCreate/workflowFolderDelete gate, not the generic keys', () => {
    it('grants CREATE_FOLDER when workflowFolderCreate is true', async () => {
      const ability = await build(
        { userPermission: { workflowFolderCreate: true } as any },
        { tj_folder_type: APP_TYPES.WORKFLOW }
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER, Folder)).toBe(true);
    });

    it('grants DELETE_FOLDER when workflowFolderDelete is true', async () => {
      const ability = await build(
        { userPermission: { workflowFolderDelete: true } as any },
        { tj_folder_type: APP_TYPES.WORKFLOW }
      );
      expect(ability.can(FEATURE_KEY.DELETE_FOLDER, Folder)).toBe(true);
    });

    it('does NOT grant CREATE_FOLDER from the generic folderCreate flag on a workflow folder', async () => {
      // The folder-type-specific key fully replaces the generic one — it does not fall back.
      const ability = await build(
        { userPermission: { folderCreate: true, workflowFolderCreate: false } as any },
        { tj_folder_type: APP_TYPES.WORKFLOW }
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER, Folder)).toBe(false);
    });
  });

  describe('module-folder type — moduleFolderCreate/moduleFolderDelete gate, not the generic keys', () => {
    it('grants CREATE_FOLDER when moduleFolderCreate is true', async () => {
      const ability = await build(
        { userPermission: { moduleFolderCreate: true } as any },
        { tj_folder_type: APP_TYPES.MODULE }
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER, Folder)).toBe(true);
    });

    it('grants DELETE_FOLDER when moduleFolderDelete is true', async () => {
      const ability = await build(
        { userPermission: { moduleFolderDelete: true } as any },
        { tj_folder_type: APP_TYPES.MODULE }
      );
      expect(ability.can(FEATURE_KEY.DELETE_FOLDER, Folder)).toBe(true);
    });

    it('does NOT grant CREATE_FOLDER from the generic folderCreate flag on a module folder', async () => {
      const ability = await build(
        { userPermission: { folderCreate: true, moduleFolderCreate: false } as any },
        { tj_folder_type: APP_TYPES.MODULE }
      );
      expect(ability.can(FEATURE_KEY.CREATE_FOLDER, Folder)).toBe(false);
    });
  });
});
