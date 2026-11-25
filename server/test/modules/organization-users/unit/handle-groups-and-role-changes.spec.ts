/** @group platform */
jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest
    .fn()
    .mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => cb(manager)),
}));

import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrganizationUsersUtilService } from '@modules/organization-users/util.service';

// Pins the invite / edit-user flow that used to hand a precomputed `endUsers` list to addUsersToGroup.
// Behaviour must be identical now that addUsersToGroup always loads end users itself.
describe('OrganizationUsersUtilService.handleGroupsAndRoleChanges', () => {
  const user = { id: 'u1' };
  const manager = {} as any;
  let service: any;
  let groupPermissionsRepository: { removeUserFromAllCustomGroupUser: jest.Mock };
  let groupPermissionsUtilService: { addUsersToGroup: jest.Mock };
  let rolesUtilService: { editDefaultGroupUserRole: jest.Mock };
  let licenseUserService: { validateUser: jest.Mock };

  beforeEach(() => {
    groupPermissionsRepository = { removeUserFromAllCustomGroupUser: jest.fn() };
    groupPermissionsUtilService = { addUsersToGroup: jest.fn().mockResolvedValue(undefined) };
    rolesUtilService = { editDefaultGroupUserRole: jest.fn() };
    licenseUserService = { validateUser: jest.fn() };
    service = Object.assign(Object.create(OrganizationUsersUtilService.prototype), {
      groupPermissionsRepository,
      groupPermissionsUtilService,
      rolesUtilService,
      licenseUserService,
      rolesRepository: { getUserRole: jest.fn().mockResolvedValue('end-user') },
    });
  });

  it('adds the user to each requested group with role change disallowed, and never sends an endUsers list', async () => {
    await service.handleGroupsAndRoleChanges(user, 'org-a', { addGroups: ['g1', 'g2'] }, manager);

    expect(groupPermissionsUtilService.addUsersToGroup.mock.calls).toEqual([
      [{ allowRoleChange: false, userIds: ['u1'], groupId: 'g1' }, 'org-a', manager],
      [{ allowRoleChange: false, userIds: ['u1'], groupId: 'g2' }, 'org-a', manager],
    ]);
    expect(licenseUserService.validateUser).toHaveBeenCalledWith(manager, 'org-a');
  });

  it('still clears custom groups first and changes the role when one is requested', async () => {
    await service.handleGroupsAndRoleChanges(
      user,
      'org-a',
      { role: 'builder', adminId: 'admin-1', addGroups: [] },
      manager
    );

    expect(groupPermissionsRepository.removeUserFromAllCustomGroupUser).toHaveBeenCalledWith('u1', 'org-a', manager);
    expect(rolesUtilService.editDefaultGroupUserRole).toHaveBeenCalledWith(
      'org-a',
      { newRole: 'builder', userId: 'u1', updatingUserId: 'admin-1', currentRole: 'end-user' },
      manager
    );
  });

  it('turns an end-user/builder-group conflict into the same BadRequest as before', async () => {
    groupPermissionsUtilService.addUsersToGroup.mockRejectedValue(new ConflictException());

    await expect(
      service.handleGroupsAndRoleChanges(user, 'org-a', { addGroups: ['g1'] }, manager)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
