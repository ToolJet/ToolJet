/** @group platform */
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AddGroupUserDto } from '@modules/group-permissions/dto';

describe('AddGroupUserDto', () => {
  it('drops a client-supplied endUsers list, so end users are always loaded from the workspace', async () => {
    const dto = plainToInstance(AddGroupUserDto, {
      groupId: 'g1',
      userIds: ['u1'],
      allowRoleChange: true,
      endUsers: [{ id: 'victim', userGroups: [{ group: { id: 'other-workspace-group' } }] }],
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toHaveLength(0);
    expect(dto).not.toHaveProperty('endUsers');
  });
});
