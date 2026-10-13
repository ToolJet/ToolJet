/**
 * Unit tests for GroupPermissionsUtilService.getGroupWithBuilderLevel — PAT flags only.
 *
 * Without a custom-groups license the method forces every boolean on a non-end-user group to
 * true so the UI shows builder permissions as fixed. patCreate/patRevoke are exempt (like
 * appPromote/appRelease): the displayed value must equal the stored value, because the ability
 * layer grants from the stored column.
 */
import { GroupPermissionsUtilService } from '../../../../src/modules/group-permissions/util.service';

function makeService(group: Record<string, unknown>, { customGroupsEnabled }: { customGroupsEnabled: boolean }) {
  const groupPermissionsRepository = { getGroup: jest.fn().mockResolvedValue(group) } as any;
  const licenseUtilService = {
    isRestrictedPlan: jest.fn().mockResolvedValue(false),
    isPromoteAndReleaseEnabled: jest.fn().mockResolvedValue({ promote: true, release: true }),
    isFeatureEnabled: jest.fn().mockResolvedValue(customGroupsEnabled),
  } as any;
  const roleUtilService = { checkIfBuilderLevelResourcesPermissions: jest.fn().mockResolvedValue(false) } as any;
  return new GroupPermissionsUtilService(
    groupPermissionsRepository,
    null as any,
    roleUtilService,
    null as any,
    null as any,
    licenseUtilService,
    null as any,
    null as any
  );
}

const builderGroup = () => ({ name: 'builder', appCreate: false, patCreate: false, patRevoke: false });

describe('GroupPermissionsUtilService.getGroupWithBuilderLevel | PAT flags', () => {
  it('should keep stored patCreate/patRevoke on the builder group when custom groups are not licensed', async () => {
    const service = makeService(builderGroup(), { customGroupsEnabled: false });

    const { group } = await service.getGroupWithBuilderLevel('g1', 'org1', {} as any);

    expect(group).toMatchObject({ appCreate: true, patCreate: false, patRevoke: false });
  });

  it('should return the stored true values unchanged when custom groups are licensed', async () => {
    const service = makeService({ ...builderGroup(), patCreate: true }, { customGroupsEnabled: true });

    const { group, isBuilderLevel } = await service.getGroupWithBuilderLevel('g1', 'org1', {} as any);

    expect(group).toMatchObject({ patCreate: true, patRevoke: false });
    expect(isBuilderLevel).toBe(true);
  });
});
