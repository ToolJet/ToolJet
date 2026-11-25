/**
 * changeEndUserToEditor used to receive `endUsersList[0].userGroups[0].group.id` from its callers.
 * It now resolves the workspace's end-user group itself. These must always be the same group, even for
 * users who also sit in custom groups or in several workspaces.
 *
 * @group platform
 */
import { INestApplication } from '@nestjs/common';
import { initTestApp, createUser, createGroupPermission, saveEntity, closeTestApp } from 'test-helper';
import { RolesRepository } from '@modules/roles/repository';
import { GroupUsers } from '@entities/group_users.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { USER_ROLE } from '@modules/group-permissions/constants';

describe('end-user group derivation', () => {
  let app: INestApplication;
  let rolesRepository: RolesRepository;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    rolesRepository = app.get(RolesRepository);
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  const oldDerivation = async (organizationId: string, userId: string) => {
    const users = await rolesRepository.getRoleUsersList(USER_ROLE.END_USER, organizationId, [userId]);
    return users[0].userGroups.map((userGroup) => userGroup.group.id);
  };

  it('gives only the workspace end-user group for a plain end user', async () => {
    const { organization, user } = await createUser(app, { email: 'plain-eu@tooljet.io', groups: ['end-user'] });

    const endUserGroup = await rolesRepository.getRole(USER_ROLE.END_USER, organization.id);

    expect(await oldDerivation(organization.id, user.id)).toEqual([endUserGroup.id]);
  });

  it('still gives only the end-user group when the user also belongs to a custom group', async () => {
    const { organization, user } = await createUser(app, { email: 'custom-eu@tooljet.io', groups: ['end-user'] });
    const custom = await createGroupPermission(app, { name: 'extra', organization } as any);
    await saveEntity(GroupUsers, { groupId: custom.id, userId: user.id } as any);

    const endUserGroup = await rolesRepository.getRole(USER_ROLE.END_USER, organization.id);

    expect(await oldDerivation(organization.id, user.id)).toEqual([endUserGroup.id]);
  });

  it('gives the right workspace group for a user who is an end user in two workspaces', async () => {
    const first = await createUser(app, { email: 'multi-eu@tooljet.io', groups: ['end-user'] });
    const second = await createUser(app, { email: 'other-owner@tooljet.io', groups: ['end-user'] });
    const secondEndUserGroup = await rolesRepository.getRole(USER_ROLE.END_USER, second.organization.id);
    await saveEntity(OrganizationUser, {
      userId: first.user.id,
      organizationId: second.organization.id,
      role: 'all-users',
      source: 'invite',
      status: 'active',
    } as any);
    await saveEntity(GroupUsers, { groupId: secondEndUserGroup.id, userId: first.user.id } as any);
    const firstEndUserGroup = await rolesRepository.getRole(USER_ROLE.END_USER, first.organization.id);

    expect(await oldDerivation(first.organization.id, first.user.id)).toEqual([firstEndUserGroup.id]);
    expect(await oldDerivation(second.organization.id, first.user.id)).toEqual([secondEndUserGroup.id]);
  });
});
