/**
 * FeatureAbilityFactory — folder-data-sources ability. Verifies the enforcement side of the
 * dedicated DATA_SOURCE_FOLDER permission resource, in particular that it is ISOLATED from
 * app-folder grants (an app-folder grant must never authorize a data-source-folder mutation, and
 * vice-versa) — the whole point of giving data-source folders their own granular resource.
 *
 * Pure: constructs the factory directly and drives defineAbilityFor (no DB, no Nest app).
 *
 * @group platform
 */
import { AbilityBuilder, Ability } from '@casl/ability';
import { FolderDataSource } from 'src/entities/folder_data_source.entity';
import { FEATURE_KEY } from 'src/modules/folder-data-sources/constants';
import { MODULES } from 'src/modules/app/constants/modules';
import { UserAllPermissions } from 'src/modules/app/types';
import { FeatureAbility, FeatureAbilityFactory } from 'src/modules/folder-data-sources/ability';

function buildAbility(
  permissions: Partial<UserAllPermissions>,
  request?: Record<string, unknown>,
  features: string[] = [FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE]
): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  const factory = new FeatureAbilityFactory({ resourceActionsPermission: jest.fn() } as any);
  (factory as any).defineAbilityFor(can, permissions as UserAllPermissions, { moduleName: '', features }, request);
  return build();
}

function baseUserPermission() {
  return {
    folderCreate: false,
    folderDelete: false,
    dataSourceFolderCreate: false,
    dataSourceFolderDelete: false,
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
    resource: [{ resourceType: MODULES.DATA_SOURCE_FOLDER }],
    userPermission: baseUserPermission() as any,
    ...overrides,
  };
}

const allEditable = {
  isAllEditable: true,
  editableFoldersId: [],
  isAllViewable: false,
  viewableFoldersId: [],
  isAllEditApps: false,
  editAppsInFoldersId: [],
};

describe('FeatureAbilityFactory — folder-data-sources ability', () => {
  it('builder with NO data-source-folder grant cannot CREATE_FOLDER_DATA_SOURCE', () => {
    const ability = buildAbility(makePermissions(), { tj_resource_id: 'folder-1' });
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(false);
  });

  it('builder with NO data-source-folder grant cannot DELETE_FOLDER_DATA_SOURCE', () => {
    const ability = buildAbility(makePermissions(), { tj_resource_id: 'folder-1' });
    expect(ability.can(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(false);
  });

  it('builder WITH DATA_SOURCE_FOLDER.isAllEditable=true CAN manage data-source folders', () => {
    const ability = buildAbility(
      makePermissions({
        userPermission: { ...baseUserPermission(), [MODULES.DATA_SOURCE_FOLDER]: allEditable } as any,
      }),
      { tj_resource_id: 'folder-1' }
    );
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(true);
    expect(ability.can(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(true);
  });

  it('builder with DATA_SOURCE_FOLDER edit on a SPECIFIC folder can only manage that folder', () => {
    const perms = makePermissions({
      userPermission: {
        ...baseUserPermission(),
        [MODULES.DATA_SOURCE_FOLDER]: { ...allEditable, isAllEditable: false, editableFoldersId: ['folder-1'] },
      } as any,
    });
    expect(ability(perms, 'folder-1').can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(true);
    expect(ability(perms, 'folder-2').can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(false);
    function ability(p: UserAllPermissions, folderId: string) {
      return buildAbility(p, { tj_resource_id: folderId });
    }
  });

  // ── ISOLATION ─────────────────────────────────────────────────────────────
  it('an APP-folder grant does NOT authorize data-source-folder mutations', () => {
    const ability = buildAbility(
      makePermissions({
        userPermission: {
          ...baseUserPermission(),
          folderCreate: true, // coarse app-folder create
          folderDelete: true,
          [MODULES.FOLDER]: allEditable, // app-folder bucket fully editable
          // NB: no DATA_SOURCE_FOLDER bucket, no dataSourceFolderCreate
        } as any,
      }),
      { tj_resource_id: 'folder-1' }
    );
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(false);
    expect(ability.can(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(false);
  });

  it('the data-source-folder coarse create flag (not folderCreate) is what grants the fallback', () => {
    const ability = buildAbility(
      makePermissions({
        userPermission: { ...baseUserPermission(), dataSourceFolderCreate: true } as any,
      }),
      { tj_resource_id: 'folder-1' }
    );
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(true);
  });

  it('folder owner can manage the data-source folder they created', () => {
    const ability = buildAbility(makePermissions(), { tj_resource_id: 'folder-1', tj_folder_owned_by_user: true }, [
      FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE,
      FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE,
    ]);
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(true);
    expect(ability.can(FEATURE_KEY.DELETE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(true);
  });

  it('admin can always manage data-source folders regardless of granular permissions', () => {
    const ability = buildAbility(
      makePermissions({ isAdmin: true, userPermission: { ...baseUserPermission(), isAdmin: true } as any }),
      { tj_resource_id: 'folder-1' }
    );
    expect(ability.can(FEATURE_KEY.CREATE_FOLDER_DATA_SOURCE, FolderDataSource)).toBe(true);
  });

  it('GET_FOLDERS is always allowed (the folder list read is unfiltered at the ability layer)', () => {
    const ability = buildAbility(makePermissions());
    expect(ability.can(FEATURE_KEY.GET_FOLDERS, FolderDataSource)).toBe(true);
  });
});
