import { AbilityBuilder, Ability } from '@casl/ability';
import { FolderApp } from 'src/entities/folder_app.entity';
import { FEATURE_KEY } from 'src/modules/folder-apps/constants';
import { MODULES } from 'src/modules/app/constants/modules';
import { APP_TYPES } from 'src/modules/apps/constants';
import { UserAllPermissions } from 'src/modules/app/types';
import { FeatureAbility, FeatureAbilityFactory } from 'src/modules/folder-apps/ability';

// ---------------------------------------------------------------------------
// Regression coverage for the stale "any builder gets full module-folder-app
// access" bypass (`tj_app_is_module && userPermission.isBuilder`) that predated
// the MODULE_FOLDER granular permission model and was removed alongside the
// getFolders() fix in server/src/modules/folder-apps/service.ts.
// ---------------------------------------------------------------------------

function buildAbility(permissions: Partial<UserAllPermissions>, request?: Record<string, unknown>): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  const factory = new FeatureAbilityFactory({ resourceActionsPermission: jest.fn() } as any);
  (factory as any).defineAbilityFor(can, permissions as UserAllPermissions, { moduleName: '', features: [] }, request);
  return build();
}

function baseUserPermission() {
  return {
    appCreate: false,
    appDelete: false,
    appRelease: false,
    appPromote: false,
    workflowCreate: false,
    workflowDelete: false,
    moduleCreate: false,
    moduleDelete: false,
    dataSourceCreate: false,
    dataSourceDelete: false,
    folderCreate: false,
    folderDelete: false,
    workflowFolderCreate: false,
    workflowFolderDelete: false,
    moduleFolderCreate: false,
    moduleFolderDelete: false,
    orgConstantCRUD: false,
    orgVariableCRUD: false,
    isAdmin: false,
    isBuilder: true,
    isEndUser: false,
    isSuperAdmin: false,
  };
}

function makePermissions(overrides: Partial<UserAllPermissions> = {}): UserAllPermissions {
  return {
    superAdmin: false,
    isAdmin: false,
    isBuilder: true,
    isEndUser: false,
    user: { id: 'user-1' } as any,
    resource: [{ resourceType: MODULES.MODULE_FOLDER }],
    userPermission: baseUserPermission() as any,
    ...overrides,
  };
}

describe('FeatureAbilityFactory — folder-apps ability (module folders)', () => {
  it('builder with NO module-folder granular permissions cannot CREATE_FOLDER_APP on a module folder', () => {
    const permissions = makePermissions();
    const ability = buildAbility(permissions, { tj_folder_type: APP_TYPES.MODULE, tj_resource_id: 'folder-1' });
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(false);
  });

  it('builder with NO module-folder granular permissions cannot DELETE_FOLDER_APP on a module folder', () => {
    const permissions = makePermissions();
    const ability = buildAbility(permissions, { tj_folder_type: APP_TYPES.MODULE, tj_resource_id: 'folder-1' });
    expect(ability.can(FEATURE_KEY.DELETE_FOLDER_APP, FolderApp)).toBe(false);
  });

  it('builder WITH MODULE_FOLDER.isAllEditable=true CAN manage module folder apps', () => {
    const permissions = makePermissions({
      userPermission: {
        ...baseUserPermission(),
        [MODULES.MODULE_FOLDER]: {
          isAllEditable: true,
          editableFoldersId: [],
          isAllViewable: false,
          viewableFoldersId: [],
          isAllEditApps: false,
          editAppsInFoldersId: [],
        },
      } as any,
    });
    const ability = buildAbility(permissions, { tj_folder_type: APP_TYPES.MODULE, tj_resource_id: 'folder-1' });
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
  });

  it('admin can always manage module folder apps regardless of granular permissions', () => {
    const permissions = makePermissions({
      isAdmin: true,
      userPermission: { ...baseUserPermission(), isAdmin: true } as any,
    });
    const ability = buildAbility(permissions, { tj_folder_type: APP_TYPES.MODULE, tj_resource_id: 'folder-1' });
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_APP, FolderApp)).toBe(true);
  });

  it('GET_FOLDERS is always allowed (unfiltered read of the folder list itself)', () => {
    const ability = buildAbility(makePermissions());
    expect(ability.can(FEATURE_KEY.GET_FOLDERS, FolderApp)).toBe(true);
  });
});
