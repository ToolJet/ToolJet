import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstanceWithEnvMock } from '../test.helper';

describe('organizations controller', () => {
  let app: INestApplication;
  let mockConfig;

  beforeEach(async () => {
    await clearDB();
    jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
      switch (key) {
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

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('should allow only authenticated users to list org users', async () => {
    await request(app.getHttpServer()).get('/api/organizations/users').expect(401);
  });

  it('should allow only authenticated users to create organization', async () => {
    await request(app.getHttpServer()).post('/api/organizations').send({ name: 'My organization' }).expect(401);
  });

  it('should create new organization if multi organization supported', async () => {
    jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
      switch (key) {
        case 'MULTI_ORGANIZATION':
          return 'true';
        default:
          return process.env[key];
      }
    });
    const { user, organization } = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const response = await request(app.getHttpServer())
      .post('/api/organizations')
      .send({ name: 'My organization' })
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(201);
    expect(response.body.organization_id).not.toBe(organization.id);
    expect(response.body.organization).toBe('My organization');
    expect(response.body.admin).toBe(true);
  });

  it('should not create new organization if multi organization not supported', async () => {
    const { user } = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    await request(app.getHttpServer())
      .post('/api/organizations')
      .send({ name: 'My organization' })
      .set('Authorization', authHeaderForUser(user))
      .expect(401);
  });

  it('should list organization users', async () => {
    const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const { user, orgUser } = userData;

    const response = await request(app.getHttpServer())
      .get('/api/organizations/users')
      .set('Authorization', authHeaderForUser(user));

    expect(response.statusCode).toBe(200);
    expect(response.body.users.length).toBe(1);

    await orgUser.reload();

    expect(response.body.users[0]).toStrictEqual({
      email: user.email,
      first_name: user.firstName,
      id: orgUser.id,
      last_name: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      role: orgUser.role,
      status: orgUser.status,
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
