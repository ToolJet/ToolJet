import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';

describe('organizations controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  it('should allow only authenticated users to list org users', async () => {
    await request(app.getHttpServer()).get('/organizations/users').expect(401);
  });

  it('should list organization users', async () => {
    const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
    const { user, orgUser } = userData;

    const response = await request(app.getHttpServer())
      .get('/organizations/users')
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
