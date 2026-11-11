import { AbilityService } from '@modules/ability/service';
import { ResourceType } from '@modules/group-permissions/constants';
import { GranularPermissions } from '@entities/granular_permissions.entity';

/**
 * @group unit
 */
describe('AbilityService (CE)', () => {
  let service: AbilityService;

  beforeEach(() => {
    service = new AbilityService({} as any);
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

  describe('resourceActionsPermission — PAT flags', () => {
    const buildService = () => {
      const abilityUtilService = { isBuilder: jest.fn().mockResolvedValue(true) };
      const svc = new AbilityService(abilityUtilService as any);
      jest.spyOn(svc, 'getResourcePermission').mockResolvedValue([
        { name: 'builder', patCreate: true, patRevoke: false, groupGranularPermissions: [] },
        { name: 'ops-admins', patCreate: false, patRevoke: true, groupGranularPermissions: [] },
      ] as any);
      return svc;
    };

    it('should OR-merge patCreate and patRevoke across the user groups', async () => {
      const svc = buildService();

      const result = await svc.resourceActionsPermission({ id: 'u1' } as any, { organizationId: 'org1' }, {} as any);

      expect(result).toMatchObject({ patCreate: true, patRevoke: true });
    });

    it('should keep patRevoke false when no group grants it', async () => {
      const svc = buildService();
      jest
        .spyOn(svc, 'getResourcePermission')
        .mockResolvedValue([
          { name: 'builder', patCreate: true, patRevoke: false, groupGranularPermissions: [] },
        ] as any);

      const result = await svc.resourceActionsPermission({ id: 'u1' } as any, { organizationId: 'org1' }, {} as any);

      expect(result).toMatchObject({ patCreate: true, patRevoke: false });
    });
  });
});
