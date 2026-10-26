import { GroupPermissions } from '../../../../src/entities/group_permissions.entity';
import { USER_ROLE } from '../../../../src/modules/group-permissions/constants';
import { highestRole } from '../../../../src/modules/roles/repository';

const role = (name: USER_ROLE) => ({ name }) as GroupPermissions;

describe('highestRole', () => {
  it('should pick admin over builder and end-user whatever order the rows arrive in', () => {
    const endUser = role(USER_ROLE.END_USER);
    const admin = role(USER_ROLE.ADMIN);
    const builder = role(USER_ROLE.BUILDER);

    expect(highestRole([endUser, admin, builder])).toBe(admin);
    expect(highestRole([builder, endUser, admin])).toBe(admin);
  });

  it('should pick builder over end-user when the end-user row comes first', () => {
    const endUser = role(USER_ROLE.END_USER);
    const builder = role(USER_ROLE.BUILDER);

    expect(highestRole([endUser, builder])).toBe(builder);
  });

  it('should return the only role when the user holds one', () => {
    const endUser = role(USER_ROLE.END_USER);

    expect(highestRole([endUser])).toBe(endUser);
  });

  it('should return null when the user holds no role', () => {
    expect(highestRole([])).toBeNull();
  });

  it('should not reorder the list it is given', () => {
    const roles = [role(USER_ROLE.END_USER), role(USER_ROLE.ADMIN), role(USER_ROLE.BUILDER)];
    const before = roles.map((r) => r.name);

    highestRole(roles);

    expect(roles.map((r) => r.name)).toEqual(before);
  });
});
