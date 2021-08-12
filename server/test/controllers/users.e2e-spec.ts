import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../test.helper';

describe('users controller', () => {
  let app: INestApplication;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
  });

  describe('update user', () => {
    it('should allow users to update their firstName, lastName and password', async () => {
  
      const userData = await createUser(app, { email: 'admin@tooljet.io', role: 'admin' });
      const { user, orgUser } = userData;
  
      const [firstName, lastName, password] = ['Daenerys', 'Targaryen', 'drogo666']
      const oldPassword = user.password;
  
      const response = await request(app.getHttpServer())
        .patch('/users/update')
        .set('Authorization', authHeaderForUser(user))
        .send({firstName, lastName, password})
  
      expect(response.statusCode).toBe(200);
  
      await user.reload();
  
      expect(user.firstName).toEqual(firstName)
      expect(user.lastName).toEqual(lastName)
      expect(user.password).not.toEqual(oldPassword)
    });
  })


  
  afterAll(async () => {
    await app.close();
  });
});
