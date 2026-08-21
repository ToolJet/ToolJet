import { GroupExistenceGuard as BaseGroupExistenceGuard } from '@modules/group-permissions/guards/group-existance.guard';
import { FEATURE_KEY, GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';

const makeContext = (request: any) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as any;

describe('GroupExistenceGuard', () => {
  it('loads the group context onto the request for group id routes', async () => {
    const request = { params: { id: 'group-1' }, user: { organizationId: 'org-1' } };
    const utilService = {
      getGroupWithBuilderLevel: jest.fn().mockResolvedValue({
        group: { id: 'group-1', type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP },
        isBuilderLevel: true,
      }),
    };
    const reflector = { get: jest.fn().mockReturnValue([FEATURE_KEY.GET_ONE]) };
    const guard = new BaseGroupExistenceGuard(utilService as any, { getGroupUser: jest.fn() } as any, reflector as any);

    const result = await guard.canActivate(makeContext(request));

    expect(result).toBe(true);
    expect(utilService.getGroupWithBuilderLevel).toHaveBeenCalledWith('group-1', 'org-1');
    expect(request.group).toEqual({ id: 'group-1', type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP });
    expect(request.tj_group).toEqual({ id: 'group-1', type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP });
    expect(request.tj_resource_id).toBe('group-1');
  });

  it('resolves DELETE_GROUP_USER through the underlying group user row id', async () => {
    const request = { params: { id: 'group-user-1' }, user: { organizationId: 'org-1' } };
    const utilService = {
      getGroupWithBuilderLevel: jest.fn().mockResolvedValue({
        group: { id: 'group-2', type: GROUP_PERMISSIONS_TYPE.DEFAULT },
        isBuilderLevel: true,
      }),
    };
    const groupPermissionsRepository = {
      getGroupUser: jest.fn().mockResolvedValue({ groupId: 'group-2' }),
    };
    const reflector = { get: jest.fn().mockReturnValue([FEATURE_KEY.DELETE_GROUP_USER]) };
    const guard = new BaseGroupExistenceGuard(utilService as any, groupPermissionsRepository as any, reflector as any);

    await guard.canActivate(makeContext(request));

    expect(groupPermissionsRepository.getGroupUser).toHaveBeenCalledWith('group-user-1');
    expect(utilService.getGroupWithBuilderLevel).toHaveBeenCalledWith('group-2', 'org-1');
    expect(request.tj_resource_id).toBe('group-2');
    expect(request.tj_group).toEqual({ id: 'group-2', type: GROUP_PERMISSIONS_TYPE.DEFAULT });
  });
});
