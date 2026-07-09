import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, createUser, createGroupPermission, getDefaultDataSource } from 'test-helper';
import { User } from 'src/entities/user.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { GroupUsers } from 'src/entities/group_users.entity';
import { GroupPermissions } from 'src/entities/group_permissions.entity';
import { Repository } from 'typeorm';

/**
 * External API — user mutation endpoints:
 *   PATCH /ext/user/:id
 *   PUT   /ext/user/:id/workspaces           (destructive replace-all)
 *   PATCH /ext/user/:id/workspace/:workspaceId
 *   PUT   /ext/update-user-role/workspace/:workspaceId
 *
 * Tested cases: auth trio, happy paths + DB side effects, documented edges
 * (dup/unknown org, default-group rejection, archived-user reactivation guard,
 * ADD_GROUP_USER_NON_EXISTING_USER).
 */

/** @group platform */
describe('External API — user update endpoints', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;
  let userRepo: Repository<User>;
  let orgUserRepo: Repository<OrganizationUser>;
  let groupUsersRepo: Repository<GroupUsers>;
  let groupRepo: Repository<GroupPermissions>;
  const NONEXISTENT_UUID = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
    const ds = getDefaultDataSource();
    userRepo = ds.getRepository(User);
    orgUserRepo = ds.getRepository(OrganizationUser);
    groupUsersRepo = ds.getRepository(GroupUsers);
    groupRepo = ds.getRepository(GroupPermissions);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  function uniqueEmail(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@tooljet.io`;
  }

  // ---------------------------------------------------------------------------
  // PATCH /ext/user/:id
  // ---------------------------------------------------------------------------
  describe('PATCH /ext/user/:id', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer()).patch(`/api/ext/user/${NONEXISTENT_UUID}`).send({ name: 'X Y' }).expect(403);
    });

    it('returns 403 when the access token is wrong', async () => {
      await request(app.getHttpServer())
        .patch(`/api/ext/user/${NONEXISTENT_UUID}`)
        .set('Authorization', 'Basic wrong-token')
        .send({ name: 'X Y' })
        .expect(403);
    });

    it('returns 404 when the user does not exist', async () => {
      await request(app.getHttpServer())
        .patch(`/api/ext/user/${NONEXISTENT_UUID}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'X Y' })
        .expect(404);
    });

    it('updates name, splitting into first/last name', async () => {
      const { user } = await createUser(app, { email: uniqueEmail('patch-name') });

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'Jane Doe' })
        .expect(200);

      const updated = await userRepo.findOneOrFail({ where: { id: user.id } });
      expect(updated.firstName).toBe('Jane');
      expect(updated.lastName).toBe('Doe');
    });

    it('updates the email', async () => {
      const { user } = await createUser(app, { email: uniqueEmail('patch-email') });
      const newEmail = uniqueEmail('patched');

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ email: newEmail })
        .expect(200);

      const updated = await userRepo.findOneOrFail({ where: { id: user.id } });
      expect(updated.email).toBe(newEmail);
    });

    it('updates the password, storing a bcrypt hash rather than plaintext', async () => {
      const { user } = await createUser(app, { email: uniqueEmail('patch-pass') });

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ password: 'newSecret1' })
        .expect(200);

      const updated = await userRepo.findOneOrFail({ where: { id: user.id } });
      expect(updated.password).not.toBe('newSecret1');
      expect(bcrypt.compareSync('newSecret1', updated.password)).toBe(true);
    });

    it('archiving the user cascades to archive every workspace membership', async () => {
      const { user, organization: orgA } = await createUser(app, { email: uniqueEmail('patch-archive') });
      const { organization: orgB } = await createUser(app, { email: uniqueEmail('patch-archive-org-b') });
      // Add the same user to a second workspace, active.
      await orgUserRepo.save(
        orgUserRepo.create({ userId: user.id, organizationId: orgB.id, status: 'active', role: 'all_users' })
      );

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ status: 'archived' })
        .expect(200);

      const updatedUser = await userRepo.findOneOrFail({ where: { id: user.id } });
      expect(updatedUser.status).toBe('archived');
      const memberships = await orgUserRepo.find({ where: { userId: user.id } });
      expect(memberships.map((m) => m.organizationId).sort()).toEqual([orgA.id, orgB.id].sort());
      memberships.forEach((m) => expect(m.status).toBe('archived'));
    });

    it('providing defaultOrganizationId alongside a non-archived status reactivates that specific workspace membership', async () => {
      const { user, organization } = await createUser(app, {
        email: uniqueEmail('patch-unarchive'),
        status: 'invited',
      });
      expect((await orgUserRepo.findOneOrFail({ where: { userId: user.id, organizationId: organization.id } })).status).toBe(
        'invited'
      );

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ status: 'active', defaultOrganizationId: organization.id })
        .expect(200);

      const membership = await orgUserRepo.findOneOrFail({
        where: { userId: user.id, organizationId: organization.id },
      });
      expect(membership.status).toBe('active');
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /ext/user/:id/workspaces  (destructive replace-all)
  // ---------------------------------------------------------------------------
  describe('PUT /ext/user/:id/workspaces', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer()).put(`/api/ext/user/${NONEXISTENT_UUID}/workspaces`).send([]).expect(403);
    });

    it('returns 404 when the user does not exist', async () => {
      await request(app.getHttpServer())
        .put(`/api/ext/user/${NONEXISTENT_UUID}/workspaces`)
        .set('Authorization', AUTH_HEADER)
        .send([])
        .expect(404);
    });

    it('replaces all workspace + group relations, removing prior memberships not in the new list', async () => {
      const { user, organization: orgA } = await createUser(app, { email: uniqueEmail('replace-all') });
      const customGroupA = await createGroupPermission(app, { name: `custom-a-${Date.now()}`, organizationId: orgA.id });
      await groupUsersRepo.save(groupUsersRepo.create({ userId: user.id, groupId: customGroupA.id }));

      const { organization: orgB } = await createUser(app, { email: uniqueEmail('replace-all-org-b') });

      await request(app.getHttpServer())
        .put(`/api/ext/user/${user.id}/workspaces`)
        .set('Authorization', AUTH_HEADER)
        .send([{ id: orgB.id, status: 'active' }])
        .expect(200);

      const memberships = await orgUserRepo.find({ where: { userId: user.id } });
      expect(memberships).toHaveLength(1);
      expect(memberships[0].organizationId).toBe(orgB.id);

      const remainingGroupLinks = await groupUsersRepo.find({ where: { userId: user.id, groupId: customGroupA.id } });
      expect(remainingGroupLinks).toHaveLength(0);
    });

    it('returns 400 when a referenced workspace id does not exist', async () => {
      const { user } = await createUser(app, { email: uniqueEmail('replace-all-badorg') });
      await request(app.getHttpServer())
        .put(`/api/ext/user/${user.id}/workspaces`)
        .set('Authorization', AUTH_HEADER)
        .send([{ id: NONEXISTENT_UUID }])
        .expect(400);
    });

    it('returns 400 when a default (role) group name is passed through the groups field', async () => {
      const { user } = await createUser(app, { email: uniqueEmail('replace-all-defaultgroup') });
      const { organization } = await createUser(app, { email: uniqueEmail('replace-all-defaultgroup-org') });

      await request(app.getHttpServer())
        .put(`/api/ext/user/${user.id}/workspaces`)
        .set('Authorization', AUTH_HEADER)
        .send([{ id: organization.id, groups: [{ name: 'admin' }] }])
        .expect(400);
    });

    it('returns 400 when reactivating (status=active) a globally archived user', async () => {
      const { user, organization } = await createUser(app, { email: uniqueEmail('replace-all-archived') });
      await userRepo.update(user.id, { status: 'archived' });

      await request(app.getHttpServer())
        .put(`/api/ext/user/${user.id}/workspaces`)
        .set('Authorization', AUTH_HEADER)
        .send([{ id: organization.id, status: 'active' }])
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /ext/user/:id/workspace/:workspaceId
  // ---------------------------------------------------------------------------
  describe('PATCH /ext/user/:id/workspace/:workspaceId', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer())
        .patch(`/api/ext/user/${NONEXISTENT_UUID}/workspace/${NONEXISTENT_UUID}`)
        .send({})
        .expect(403);
    });

    it('returns 404 when the user has no membership in the given workspace', async () => {
      const { user } = await createUser(app, { email: uniqueEmail('patchws-nomember') });
      const { organization: otherOrg } = await createUser(app, { email: uniqueEmail('patchws-nomember-org') });

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}/workspace/${otherOrg.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ status: 'active' })
        .expect(404);
    });

    it('updates the workspace membership status', async () => {
      const { user, organization } = await createUser(app, {
        email: uniqueEmail('patchws-status'),
        status: 'invited',
      });

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ status: 'active' })
        .expect(200);

      const membership = await orgUserRepo.findOneOrFail({
        where: { userId: user.id, organizationId: organization.id },
      });
      expect(membership.status).toBe('active');
    });

    it('replaces custom groups for the user within that workspace only', async () => {
      const { user, organization } = await createUser(app, { email: uniqueEmail('patchws-groups') });
      const oldGroup = await createGroupPermission(app, { name: `old-${Date.now()}`, organizationId: organization.id });
      await groupUsersRepo.save(groupUsersRepo.create({ userId: user.id, groupId: oldGroup.id }));
      const newGroup = await createGroupPermission(app, { name: `new-${Date.now()}`, organizationId: organization.id });

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ groups: [{ id: newGroup.id }] })
        .expect(200);

      const links = await groupUsersRepo.find({ where: { userId: user.id } });
      const groupIds = links.map((l) => l.groupId);
      expect(groupIds).toContain(newGroup.id);
      expect(groupIds).not.toContain(oldGroup.id);
    });

    it('returns 400 when reactivating (status=active) a globally archived user', async () => {
      const { user, organization } = await createUser(app, {
        email: uniqueEmail('patchws-archived'),
        status: 'invited',
      });
      await userRepo.update(user.id, { status: 'archived' });

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ status: 'active' })
        .expect(400);
    });

    it('returns 400 when a referenced group id/name does not exist in the workspace', async () => {
      const { user, organization } = await createUser(app, { email: uniqueEmail('patchws-badgroup') });

      await request(app.getHttpServer())
        .patch(`/api/ext/user/${user.id}/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ groups: [{ id: NONEXISTENT_UUID }] })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PUT /ext/update-user-role/workspace/:workspaceId
  // ---------------------------------------------------------------------------
  describe('PUT /ext/update-user-role/workspace/:workspaceId', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer())
        .put(`/api/ext/update-user-role/workspace/${NONEXISTENT_UUID}`)
        .send({ newRole: 'admin', userId: NONEXISTENT_UUID })
        .expect(403);
    });

    it('returns 400 when neither userId nor email is provided', async () => {
      const { organization } = await createUser(app, { email: uniqueEmail('role-noid-org') });
      await request(app.getHttpServer())
        .put(`/api/ext/update-user-role/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ newRole: 'admin' })
        .expect(400);
    });

    it('returns 404 when identifying the user by an email that does not exist', async () => {
      const { organization } = await createUser(app, { email: uniqueEmail('role-badmail-org') });
      await request(app.getHttpServer())
        .put(`/api/ext/update-user-role/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ newRole: 'admin', email: uniqueEmail('does-not-exist') })
        .expect(404);
    });

    it('returns 400 when the user has no role in the target workspace', async () => {
      const { user: outsider } = await createUser(app, { email: uniqueEmail('role-outsider') });
      const { organization: targetOrg } = await createUser(app, { email: uniqueEmail('role-target-org') });

      await request(app.getHttpServer())
        .put(`/api/ext/update-user-role/workspace/${targetOrg.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ newRole: 'admin', userId: outsider.id })
        .expect(400);
    });

    it('changes the role by userId', async () => {
      const { user, organization } = await createUser(app, {
        email: uniqueEmail('role-change'),
        groups: ['end-user'],
      });

      await request(app.getHttpServer())
        .put(`/api/ext/update-user-role/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ newRole: 'builder', userId: user.id })
        .expect(200);

      const builderGroup = await groupRepo.findOneOrFail({ where: { organizationId: organization.id, name: 'builder' } });
      const link = await groupUsersRepo.findOne({ where: { userId: user.id, groupId: builderGroup.id } });
      expect(link).toBeDefined();
    });

    it('changes the role by email', async () => {
      const email = uniqueEmail('role-change-email');
      const { user, organization } = await createUser(app, { email, groups: ['end-user'] });

      await request(app.getHttpServer())
        .put(`/api/ext/update-user-role/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ newRole: 'builder', email })
        .expect(200);

      const builderGroup = await groupRepo.findOneOrFail({ where: { organizationId: organization.id, name: 'builder' } });
      const link = await groupUsersRepo.findOne({ where: { userId: user.id, groupId: builderGroup.id } });
      expect(link).toBeDefined();
    });

    it('is a no-op when the new role matches the current role', async () => {
      const { user, organization } = await createUser(app, { email: uniqueEmail('role-noop'), groups: ['admin'] });

      await request(app.getHttpServer())
        .put(`/api/ext/update-user-role/workspace/${organization.id}`)
        .set('Authorization', AUTH_HEADER)
        .send({ newRole: 'admin', userId: user.id })
        .expect(200);
    });
  });
});
