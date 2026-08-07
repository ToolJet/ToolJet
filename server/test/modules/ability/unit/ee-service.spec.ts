/** @group platform */
// server/test/modules/ability/unit/ee-service.spec.ts
//
// ee/ability/service.ts (643L) is the EE permission resolver. Most of it is
// DB-backed (getResourcePermission's role/plan queries, createUserAppsPermissions'
// folder/app queries) — left to e2e. This spec covers the two purely-computational
// pieces with no DB dependency (createUserDataSourcesPermissions,
// createUserFolderPermissions), plus resourceActionsPermission's environment-access
// override logic — the license-gated, security-relevant branch that decides which
// environments a builder can reach — with getResourcePermission and
// AbilityUtilService mocked out so the override branches run in isolation.
import { AbilityService } from '@ee/ability/service';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { ResourceType } from '@ee/group-permissions/constants';

describe('AbilityService.createUserDataSourcesPermissions', () => {
  let service: AbilityService;

  beforeEach(() => {
    service = new AbilityService({} as any, {} as any, {} as any);
  });

  const grant = (overrides: { isAll?: boolean; canConfigure?: boolean; canUse?: boolean; ids?: string[] }) => ({
    isAll: overrides.isAll ?? false,
    dataSourcesGroupPermission: {
      canConfigure: overrides.canConfigure ?? false,
      canUse: overrides.canUse ?? false,
      groupDataSources: (overrides.ids ?? []).map((dataSourceId) => ({ dataSourceId })),
    },
  });

  it('returns all-false defaults when there are no granular permissions', async () => {
    const result = await service.createUserDataSourcesPermissions([]);
    expect(result).toEqual({
      usableDataSourcesId: [],
      isAllUsable: false,
      configurableDataSourceId: [],
      isAllConfigurable: false,
    });
  });

  it('sets isAllConfigurable/isAllUsable when a default-group (isAll) grant has canConfigure/canUse', async () => {
    const result = await service.createUserDataSourcesPermissions([
      grant({ isAll: true, canConfigure: true, canUse: true }) as any,
    ]);
    expect(result.isAllConfigurable).toBe(true);
    expect(result.isAllUsable).toBe(true);
  });

  it('collects data source IDs into configurableDataSourceId/usableDataSourcesId for scoped grants', async () => {
    const result = await service.createUserDataSourcesPermissions([
      grant({ canConfigure: true, ids: ['ds-1', 'ds-2'] }) as any,
      grant({ canUse: true, ids: ['ds-2', 'ds-3'] }) as any,
    ]);
    expect(result.configurableDataSourceId.sort()).toEqual(['ds-1', 'ds-2']);
    expect(result.usableDataSourcesId.sort()).toEqual(['ds-2', 'ds-3']);
  });
});

describe('AbilityService.createUserContainerFolderPermissions', () => {
  let service: AbilityService;

  beforeEach(() => {
    service = new AbilityService({} as any, {} as any, {} as any);
  });

  const grant = (overrides: {
    isAll?: boolean;
    canEditFolder?: boolean;
    canEditApps?: boolean;
    canViewApps?: boolean;
    ids?: string[];
    type?: ResourceType;
  }) => ({
    isAll: overrides.isAll ?? false,
    type: overrides.type ?? ResourceType.FOLDER,
    foldersGroupPermissions: {
      canEditFolder: overrides.canEditFolder ?? false,
      canEditApps: overrides.canEditApps ?? false,
      canViewApps: overrides.canViewApps ?? false,
      groupFolders: (overrides.ids ?? []).map((folderId) => ({ folderId })),
    },
  });

  it('canEditFolder implies both canEditApps and canViewApps (permission hierarchy)', () => {
    const result = service.createUserContainerFolderPermissions(
      [grant({ canEditFolder: true, ids: ['f-1'] }) as any],
      ResourceType.FOLDER
    );
    expect(result.editableFoldersId).toEqual(['f-1']);
    expect(result.editAppsInFoldersId).toEqual(['f-1']);
    expect(result.viewableFoldersId).toEqual(['f-1']);
  });

  it('canEditApps implies canViewApps but not canEditFolder', () => {
    const result = service.createUserContainerFolderPermissions(
      [grant({ canEditApps: true, ids: ['f-1'] }) as any],
      ResourceType.FOLDER
    );
    expect(result.editableFoldersId).toEqual([]);
    expect(result.editAppsInFoldersId).toEqual(['f-1']);
    expect(result.viewableFoldersId).toEqual(['f-1']);
  });

  it('canViewApps alone grants only view', () => {
    const result = service.createUserContainerFolderPermissions(
      [grant({ canViewApps: true, ids: ['f-1'] }) as any],
      ResourceType.FOLDER
    );
    expect(result.viewableFoldersId).toEqual(['f-1']);
    expect(result.editAppsInFoldersId).toEqual([]);
    expect(result.editableFoldersId).toEqual([]);
  });

  it('isAll grants set the isAllX flags instead of populating ID lists', () => {
    const result = service.createUserContainerFolderPermissions(
      [grant({ isAll: true, canEditFolder: true }) as any],
      ResourceType.FOLDER
    );
    expect(result.isAllEditable).toBe(true);
    expect(result.isAllEditApps).toBe(true);
    expect(result.isAllViewable).toBe(true);
    expect(result.editableFoldersId).toEqual([]);
  });

  it('dedupes folder IDs across multiple grants', () => {
    const result = service.createUserContainerFolderPermissions(
      [
        grant({ canViewApps: true, ids: ['f-1', 'f-2'] }) as any,
        grant({ canViewApps: true, ids: ['f-2', 'f-3'] }) as any,
      ],
      ResourceType.FOLDER
    );
    expect(result.viewableFoldersId.sort()).toEqual(['f-1', 'f-2', 'f-3']);
  });

  it('filters out grants of a different resource type', () => {
    const result = service.createUserContainerFolderPermissions(
      [grant({ canViewApps: true, ids: ['f-1'], type: ResourceType.WORKFLOW_FOLDER }) as any],
      ResourceType.FOLDER
    );
    expect(result.viewableFoldersId).toEqual([]);
  });

  it('resolves module folders to no access for an end user even when granted', () => {
    const result = service.createUserContainerFolderPermissions(
      [grant({ isAll: true, canEditFolder: true, type: ResourceType.MODULE_FOLDER }) as any],
      ResourceType.MODULE_FOLDER,
      true
    );
    expect(result.isAllEditable).toBe(false);
    expect(result.isAllViewable).toBe(false);
  });
});

describe('AbilityService.resourceActionsPermission — builder environment-access overrides', () => {
  let service: AbilityService;
  let licenseTermsService: { getLicenseTerms: jest.Mock };
  let abilityUtilService: {
    isBuilder: jest.Mock;
    createUserAppsPermissions: jest.Mock;
    createUserModulesPermissions: jest.Mock;
  };
  const user = { id: 'user-1', organizationId: 'org-1' } as any;
  const manager = {} as any; // dbTransactionWrap short-circuits to operation(manager) when manager is truthy

  const adminGroup = () => [{ name: 'admin', groupGranularPermissions: [] } as any];
  const builderGroup = () => [{ name: 'builder', groupGranularPermissions: [] } as any];

  beforeEach(() => {
    licenseTermsService = { getLicenseTerms: jest.fn().mockResolvedValue(true) };
    abilityUtilService = {
      isBuilder: jest.fn().mockResolvedValue(true),
      createUserAppsPermissions: jest.fn(),
      createUserModulesPermissions: jest.fn(),
    };
    service = new AbilityService(licenseTermsService as any, {} as any, abilityUtilService as any);
    jest.spyOn(service, 'getResourcePermission').mockResolvedValue(builderGroup());
  });

  afterEach(() => jest.restoreAllMocks());

  const appPerms = (overrides: any = {}) => ({
    editableAppsId: [],
    isAllEditable: false,
    viewableAppsId: [],
    isAllViewable: false,
    hiddenAppsId: [],
    hideAll: false,
    ownedAppsId: [],
    environmentAccess: { development: false, staging: false, production: false, released: false },
    appSpecificEnvironmentAccess: {},
    ...overrides,
  });

  const query = { organizationId: 'org-1', resources: [{ resource: MODULES.APP }] };

  it('forces production access to true (globally and per-app) when the license is invalid', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(
      appPerms({
        appSpecificEnvironmentAccess: {
          'app-1': { development: false, staging: false, production: false, released: false },
        },
      })
    );
    licenseTermsService.getLicenseTerms.mockImplementation((field: string) =>
      Promise.resolve(field === LICENSE_FIELD.VALID ? false : true)
    );

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].environmentAccess.production).toBe(true);
    expect(result[MODULES.APP].appSpecificEnvironmentAccess['app-1'].production).toBe(true);
  });

  it('does not force production when the license is valid and multi-environment is enabled', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms());
    licenseTermsService.getLicenseTerms.mockResolvedValue(true);

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].environmentAccess.production).toBe(false);
  });

  it('grants development and released for an editable app with no existing or default explicit permissions', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms({ editableAppsId: ['app-1'] }));

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].appSpecificEnvironmentAccess['app-1']).toMatchObject({
      development: true,
      released: true,
    });
  });

  it('grants only development (not released) for an editable app when the default group already has explicit permissions', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(
      appPerms({
        editableAppsId: ['app-1'],
        environmentAccess: { development: false, staging: true, production: false, released: false },
      })
    );

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].appSpecificEnvironmentAccess['app-1']).toMatchObject({
      development: true,
      staging: false,
      production: false,
      released: false,
    });
  });

  it('respects existing explicit app-specific permissions, only adding development on top', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(
      appPerms({
        editableAppsId: ['app-1'],
        appSpecificEnvironmentAccess: {
          'app-1': { development: false, staging: true, production: false, released: false },
        },
      })
    );

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].appSpecificEnvironmentAccess['app-1']).toMatchObject({
      development: true,
      staging: true,
    });
  });

  it('grants released-only access for a viewable app with no existing app-specific access', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms({ viewableAppsId: ['app-2'] }));

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].appSpecificEnvironmentAccess['app-2']).toMatchObject({
      development: false,
      staging: false,
      production: false,
      released: true,
    });
  });

  it('defaults environmentAccess to development+released when isAllEditable and nothing was explicitly set', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms({ isAllEditable: true }));

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].environmentAccess).toMatchObject({ development: true, released: true });
  });

  it('defaults environmentAccess to released-only when isAllViewable (not isAllEditable) and nothing was set', async () => {
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms({ isAllViewable: true }));

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result[MODULES.APP].environmentAccess).toMatchObject({
      development: false,
      released: true,
    });
  });

  it('skips the environment-access override entirely for a non-builder (end user)', async () => {
    abilityUtilService.isBuilder.mockResolvedValue(false);
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms({ editableAppsId: ['app-1'] }));

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result.isEndUser).toBe(true);
    expect(result[MODULES.APP].appSpecificEnvironmentAccess['app-1']).toBeUndefined();
  });

  it('does not resolve builder/end-user role or call createUserAppsPermissions for an admin group', async () => {
    jest.spyOn(service, 'getResourcePermission').mockResolvedValue(adminGroup());
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms());

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result.isAdmin).toBe(true);
    expect(result.isBuilder).toBe(false);
    expect(abilityUtilService.isBuilder).not.toHaveBeenCalled();
  });

  it('resolves MODULES resources via createUserModulesPermissions with no environment override', async () => {
    // Modules resolve via their own granular permissions (app_type='module'), kept
    // separate from the app bucket — no environment overrides (no dev-lifecycle on LTS).
    abilityUtilService.createUserModulesPermissions.mockResolvedValue({ editableAppsId: ['mod-1'] });

    const result = await service.resourceActionsPermission(
      user,
      { organizationId: 'org-1', resources: [{ resource: MODULES.MODULES }] } as any,
      manager
    );

    expect(abilityUtilService.createUserModulesPermissions).toHaveBeenCalled();
    expect(result[MODULES.MODULES]).toEqual({ editableAppsId: ['mod-1'] });
  });

  // #17392 — every other field in this reduce merges via `acc.X || group.X`, but
  // orgVariableCRUD only ever reads `acc.orgVariableCRUD` — it never ORs in the
  // group's value, so it is permanently false regardless of what any group actually
  // grants. This documents the CURRENT (buggy) behavior; flagged separately rather
  // than treated as intended.
  it('BUG: orgVariableCRUD never merges from the group and is always false', async () => {
    jest
      .spyOn(service, 'getResourcePermission')
      .mockResolvedValue([{ name: 'builder', groupGranularPermissions: [], orgVariableCRUD: true } as any]);
    abilityUtilService.createUserAppsPermissions.mockResolvedValue(appPerms());

    const result = await service.resourceActionsPermission(user, query as any, manager);

    expect(result.orgVariableCRUD).toBe(false);
  });
});
