/** @group platform */
import { RolesUtilService } from '@modules/roles/util.service';
import { GroupUsers } from '@entities/group_users.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { In } from 'typeorm';

describe('RolesUtilService.changeEndUserToEditor', () => {
  const groups = {
    [USER_ROLE.END_USER]: { id: 'org-a-end-user-group' },
    [USER_ROLE.BUILDER]: { id: 'org-a-builder-group' },
  };
  let manager: { delete: jest.Mock; insert: jest.Mock };
  let roleRepository: { getRole: jest.Mock };
  let service: RolesUtilService;

  beforeEach(() => {
    manager = { delete: jest.fn(), insert: jest.fn() };
    roleRepository = { getRole: jest.fn(async (role: USER_ROLE) => groups[role]) };
    service = new RolesUtilService(null as any, roleRepository as any, null as any);
  });

  it("removes the users from the workspace's own end-user group and adds them to its builder group", async () => {
    await service.changeEndUserToEditor('org-a', ['u1', 'u2'], manager as any);

    expect(roleRepository.getRole).toHaveBeenCalledWith(USER_ROLE.END_USER, 'org-a', manager);
    expect(manager.delete).toHaveBeenCalledWith(GroupUsers, {
      groupId: 'org-a-end-user-group',
      userId: In(['u1', 'u2']),
    });
    expect(manager.insert).toHaveBeenCalledWith(GroupUsers, [
      { groupId: 'org-a-builder-group', userId: 'u1' },
      { groupId: 'org-a-builder-group', userId: 'u2' },
    ]);
  });

  it('does nothing when there are no users', async () => {
    await service.changeEndUserToEditor('org-a', [], manager as any);

    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.insert).not.toHaveBeenCalled();
  });
});
