import { AbilityService } from '@ee/ability/service';
import { ResourceType, USER_ROLE } from '@modules/group-permissions/constants';
import { GranularPermissions } from '@entities/granular_permissions.entity';

jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => {
    return cb(manager ?? {});
  }),
}));

/**
 * @group unit
 */
describe('AbilityService (EE)', () => {
  let service: AbilityService;

  beforeEach(() => {
    service = new AbilityService({} as any, {} as any, {} as any);
  });

  const buildGranularPermission = (
    overrides: Partial<{
      isAll: boolean;
      canEditFolder: boolean;
      canEditApps: boolean;
      canViewApps: boolean;
      folderIds: string[];
      type: ResourceType;
    }>
  ): GranularPermissions => {
    const {
      isAll = false,
      canEditFolder = false,
      canEditApps = false,
      canViewApps = false,
      folderIds = [],
      type = ResourceType.FOLDER,
    } = overrides;

    return {
      isAll,
      type,
      foldersGroupPermissions: {
        canEditFolder,
        canEditApps,
        canViewApps,
        groupFolders: folderIds.map((folderId) => ({ folderId })),
      },
    } as unknown as GranularPermissions;
  };

  describe.each([
    ['FOLDER', ResourceType.FOLDER],
    ['WORKFLOW_FOLDER', ResourceType.WORKFLOW_FOLDER],
  ])('createUserContainerFolderPermissions — %s', (_label, resourceType) => {
    it('grants isAll* flags when isAll=true and canEditFolder=true (tier implies lower tiers)', () => {
      const granular = buildGranularPermission({ isAll: true, canEditFolder: true, type: resourceType });

      const result = service.createUserContainerFolderPermissions([granular], resourceType);

      expect(result.isAllEditable).toBe(true);
      expect(result.isAllEditApps).toBe(true);
      expect(result.isAllViewable).toBe(true);
    });

    it('grants only isAllViewable when isAll=true and only canViewApps=true', () => {
      const granular = buildGranularPermission({ isAll: true, canViewApps: true, type: resourceType });

      const result = service.createUserContainerFolderPermissions([granular], resourceType);

      expect(result.isAllEditable).toBe(false);
      expect(result.isAllEditApps).toBe(false);
      expect(result.isAllViewable).toBe(true);
    });

    it('populates scoped folder ids for a non-isAll grant, deduplicated', () => {
      const granular = buildGranularPermission({
        isAll: false,
        canEditFolder: true,
        folderIds: ['f1', 'f2', 'f1'],
        type: resourceType,
      });

      const result = service.createUserContainerFolderPermissions([granular], resourceType);

      expect(result.editableFoldersId.sort()).toEqual(['f1', 'f2']);
      expect(result.editAppsInFoldersId.sort()).toEqual(['f1', 'f2']);
      expect(result.viewableFoldersId.sort()).toEqual(['f1', 'f2']);
    });

    it('canEditApps implies canViewApps but not canEditFolder, for scoped folder ids', () => {
      const granular = buildGranularPermission({
        isAll: false,
        canEditApps: true,
        folderIds: ['f1'],
        type: resourceType,
      });

      const result = service.createUserContainerFolderPermissions([granular], resourceType);

      expect(result.editableFoldersId).toEqual([]);
      expect(result.editAppsInFoldersId).toEqual(['f1']);
      expect(result.viewableFoldersId).toEqual(['f1']);
    });

    it('filters out granular permissions of a different resource type', () => {
      const otherType = resourceType === ResourceType.FOLDER ? ResourceType.WORKFLOW_FOLDER : ResourceType.FOLDER;
      const matching = buildGranularPermission({
        isAll: false,
        canViewApps: true,
        folderIds: ['f1'],
        type: resourceType,
      });
      const nonMatching = buildGranularPermission({
        isAll: false,
        canEditFolder: true,
        folderIds: ['f2'],
        type: otherType,
      });

      const result = service.createUserContainerFolderPermissions([matching, nonMatching], resourceType);

      expect(result.viewableFoldersId).toEqual(['f1']);
      expect(result.editableFoldersId).toEqual([]);
    });
  });
});

/**
 * Unit test for the release-license override in AbilityService.resourceActionsPermission — the
 * 3rd of the 3 call sites the release-flag consolidation touches (the other two are covered in
 * roles/unit/check-builder-level-resources-permissions.spec.ts and
 * group-permissions/unit/granular-permissions.util.service.spec.ts). A builder normally only gets
 * promote/release ability from their group permissions; when the org lacks the `release` license,
 * this method forces both to true instead so dev-lifecycle stays usable without the paid feature.
 *
 * getResourcePermission (a large, DB-query-heavy method) is stubbed out directly so this test only
 * exercises the license-override logic that runs after it.
 */
function makeReleaseOverrideService(getLicenseTerms: jest.Mock): AbilityService {
  const licenseTermsService = { getLicenseTerms } as any;
  const abilityUtilService = { isBuilder: jest.fn().mockResolvedValue(true) } as any;
  const service = new AbilityService(licenseTermsService, null as any, abilityUtilService);
  jest.spyOn(service, 'getResourcePermission').mockResolvedValue([{ name: USER_ROLE.BUILDER } as any]);
  return service;
}

describe('AbilityService.resourceActionsPermission (release-license override)', () => {
  const user = { id: 'user-1', organizationId: 'org-uuid-1' } as any;

  it('leaves promote/release as-is for a builder when the org has the release license', async () => {
    const service = makeReleaseOverrideService(jest.fn().mockResolvedValue(true));

    const result = await service.resourceActionsPermission(user, { organizationId: user.organizationId } as any);

    expect(result.appPromote).toBeFalsy();
    expect(result.appRelease).toBeFalsy();
  });

  it('forces promote/release to true for a builder when the org lacks the release license', async () => {
    const service = makeReleaseOverrideService(jest.fn().mockResolvedValue(false));

    const result = await service.resourceActionsPermission(user, { organizationId: user.organizationId } as any);

    expect(result.appPromote).toBe(true);
    expect(result.appRelease).toBe(true);
  });
});
