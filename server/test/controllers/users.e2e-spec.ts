import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstanceWithEnvMock } from '../test.helper';
import { getManager } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { OrganizationUser } from 'src/entities/organization_user.entity';

describe('users controller', () => {
  let app: INestApplication;
  let mockConfig;

  beforeEach(async () => {
    await clearDB();
    jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
      switch (key) {
        case 'DISABLE_SIGNUPS':
          return 'false';
        case 'MULTI_ORGANIZATION':
          return 'false';
        default:
          return process.env[key];
      }
    });
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
  });

  describe('PATCH /api/users/change_password', () => {
    it('should allow users to update their password', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/api/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({ currentPassword: 'password', newPassword: 'new password' });

      expect(response.statusCode).toBe(200);
      const updatedUser = await getManager().findOneOrFail(User, { where: { email: user.email } });
      expect(updatedUser.password).not.toEqual(oldPassword);
    });

    it('should not allow users to update their password if entered current password is wrong', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const oldPassword = user.password;

      const response = await request(app.getHttpServer())
        .patch('/api/users/change_password')
        .set('Authorization', authHeaderForUser(user))
        .send({
          currentPassword: 'wrong password',
          newPassword: 'new password',
        });

      expect(response.statusCode).toBe(403);

      const updatedUser = await getManager().findOneOrFail(User, { where: { email: user.email } });
      expect(updatedUser.password).toEqual(oldPassword);
    });
  });

  describe('PATCH /api/users/update', () => {
    it('should allow users to update their firstName, lastName and password', async () => {
      const userData = await createUser(app, { email: 'admin@tooljet.io' });
      const { user } = userData;

      const [firstName, lastName] = ['Daenerys', 'Targaryen'];

      const response = await request(app.getHttpServer())
        .patch('/api/users/update')
        .set('Authorization', authHeaderForUser(user))
        .send({ first_name: firstName, last_name: lastName });

      expect(response.statusCode).toBe(200);

      const updatedUser = await getManager().findOneOrFail(User, { where: { email: user.email } });
      expect(updatedUser.firstName).toEqual(firstName);
      expect(updatedUser.lastName).toEqual(lastName);
    });
  });

  describe('POST /api/users/set_password_from_token', () => {
    it('should allow users to setup account after sign up using  multi organization', async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_SIGNUPS':
            return 'false';
          case 'MULTI_ORGANIZATION':
            return 'true';
          default:
            return process.env[key];
        }
      });
      const invitationToken = uuidv4();
      const userData = await createUser(app, {
        email: 'signup@tooljet.io',
        invitationToken,
        status: 'invited',
      });
      const { user, organization } = userData;

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token').send({
        first_name: 'signupuser',
        last_name: 'user',
        organization: 'org1',
        password: uuidv4(),
        token: invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(201);

      const updatedUser = await getManager().findOneOrFail(User, { where: { email: user.email } });
      expect(updatedUser.firstName).toEqual('signupuser');
      expect(updatedUser.lastName).toEqual('user');
      expect(updatedUser.defaultOrganizationId).toEqual(organization.id);
      const organizationUser = await getManager().findOneOrFail(OrganizationUser, { where: { userId: user.id } });
      expect(organizationUser.status).toEqual('active');
    });

    it('should return error if required params are not present - multi organization', async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_SIGNUPS':
            return 'false';
          case 'MULTI_ORGANIZATION':
            return 'true';
          default:
            return process.env[key];
        }
      });
      const invitationToken = uuidv4();
      await createUser(app, {
        email: 'signup@tooljet.io',
        invitationToken,
        status: 'invited',
      });

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toStrictEqual([
        'password should not be empty',
        'password must be a string',
        'token should not be empty',
        'token must be a string',
      ]);
    });

    it('should not allow users to setup account for single organization', async () => {
      const invitationToken = uuidv4();
      await createUser(app, {
        email: 'signup@tooljet.io',
        invitationToken,
        status: 'invited',
      });

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token').send({
        first_name: 'signupuser',
        last_name: 'user',
        organization: 'org1',
        password: uuidv4(),
        token: invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(403);
    });

    it('should not allow users to setup account for multi organization and sign up disabled', async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'DISABLE_SIGNUPS':
            return 'true';
          case 'MULTI_ORGANIZATION':
            return 'true';
          default:
            return process.env[key];
        }
      });
      const invitationToken = uuidv4();
      await createUser(app, {
        email: 'signup@tooljet.io',
        invitationToken,
        status: 'invited',
      });

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token').send({
        first_name: 'signupuser',
        last_name: 'user',
        organization: 'org1',
        password: uuidv4(),
        token: invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow users to setup account if already invited to an organization but not activated', async () => {
      const org = (
        await createUser(app, {
          email: 'admin@tooljet.io',
        })
      ).organization;
      const invitedUser = await createUser(app, {
        email: 'invited@tooljet.io',
        status: 'invited',
        organization: org,
      });

      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'MULTI_ORGANIZATION':
            return 'true';
          default:
            return process.env[key];
        }
      });

      const signUpResponse = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'invited@tooljet.io' });

      expect(signUpResponse.statusCode).toBe(201);

      const invitedUserDetails = await getManager().findOneOrFail(User, { where: { email: invitedUser.user.email } });

      expect(invitedUserDetails.defaultOrganizationId).not.toBe(org.id);

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token').send({
        first_name: 'signupuser',
        last_name: 'user',
        organization: 'org1',
        password: uuidv4(),
        token: invitedUserDetails.invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(201);
      const updatedUser = await getManager().findOneOrFail(User, { where: { email: invitedUser.user.email } });
      expect(updatedUser.firstName).toEqual('signupuser');
      expect(updatedUser.lastName).toEqual('user');
      expect(updatedUser.defaultOrganizationId).not.toBe(org.id);
      const organizationUser = await getManager().findOneOrFail(OrganizationUser, {
        where: { userId: invitedUser.user.id, organizationId: org.id },
      });
      const defaultOrganizationUser = await getManager().findOneOrFail(OrganizationUser, {
        where: { userId: invitedUser.user.id, organizationId: invitedUserDetails.defaultOrganizationId },
      });
      expect(organizationUser.status).toEqual('invited');
      expect(defaultOrganizationUser.status).toEqual('active');
    });

    it('should not allow users to setup account if already invited to an organization and activated account through invite link after sign up', async () => {
      const { organization: org } = await createUser(app, {
        email: 'admin@tooljet.io',
      });
      const invitedUser = await createUser(app, {
        email: 'invited@tooljet.io',
        status: 'invited',
        organization: org,
      });

      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'MULTI_ORGANIZATION':
            return 'true';
          default:
            return process.env[key];
        }
      });

      const signUpResponse = await request(app.getHttpServer())
        .post('/api/signup')
        .send({ email: 'invited@tooljet.io' });

      expect(signUpResponse.statusCode).toBe(201);

      const invitedUserDetails = await getManager().findOneOrFail(User, { where: { email: invitedUser.user.email } });

      expect(invitedUserDetails.defaultOrganizationId).not.toBe(org.id);

      const acceptInviteResponse = await request(app.getHttpServer()).post('/api/users/accept-invite').send({
        token: invitedUser.orgUser.invitationToken,
        password: 'new-password',
      });

      expect(acceptInviteResponse.statusCode).toBe(201);

      const organizationUser = await getManager().findOneOrFail(OrganizationUser, {
        where: { userId: invitedUser.user.id, organizationId: org.id },
      });
      const defaultOrganizationUser = await getManager().findOneOrFail(OrganizationUser, {
        where: { userId: invitedUser.user.id, organizationId: invitedUserDetails.defaultOrganizationId },
      });
      expect(organizationUser.status).toEqual('active');
      expect(defaultOrganizationUser.status).toEqual('active');

      const updatedUser = await getManager().findOneOrFail(User, { where: { email: invitedUser.user.email } });
      expect(updatedUser.defaultOrganizationId).toBe(defaultOrganizationUser.organizationId);

      const response = await request(app.getHttpServer()).post('/api/users/set_password_from_token').send({
        first_name: 'signupuser',
        last_name: 'user',
        organization: 'org1',
        password: uuidv4(),
        token: invitedUserDetails.invitationToken,
        role: 'developer',
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/users/accept-invite', () => {
    it('should allow users to accept invitation when multi organization is enabled', async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'MULTI_ORGANIZATION':
            return 'true';
          default:
            return process.env[key];
        }
      });
      const userData = await createUser(app, {
        email: 'organizationUser@tooljet.io',
        status: 'invited',
      });
      const { user, orgUser } = userData;

      const response = await request(app.getHttpServer()).post('/api/users/accept-invite').send({
        token: orgUser.invitationToken,
        password: uuidv4(),
      });

      expect(response.statusCode).toBe(201);

      const organizationUser = await getManager().findOneOrFail(OrganizationUser, { where: { userId: user.id } });
      expect(organizationUser.status).toEqual('active');
    });

    it('should allow users to accept invitation when multi organization is disabled', async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'MULTI_ORGANIZATION':
            return 'false';
          default:
            return process.env[key];
        }
      });
      const userData = await createUser(app, {
        email: 'organizationUser@tooljet.io',
        status: 'invited',
      });
      const { user, orgUser } = userData;

      const response = await request(app.getHttpServer()).post('/api/users/accept-invite').send({
        token: orgUser.invitationToken,
        password: uuidv4(),
      });

      expect(response.statusCode).toBe(201);

      const organizationUser = await getManager().findOneOrFail(OrganizationUser, { where: { userId: user.id } });
      expect(organizationUser.status).toEqual('active');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
