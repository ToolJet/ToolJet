import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstance } from '../../test.helper';
import { Repository } from 'typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';

describe('organizations controller', () => {
  let app: INestApplication;
  let instanceSettingsRepository: Repository<InstanceSettings>;

  beforeEach(async () => {
    await clearDB();
    await instanceSettingsRepository.update({ key: 'ALLOW_PERSONAL_WORKSPACE' }, { value: 'false' });
  });

  beforeAll(async () => {
    app = await createNestAppInstance();
    instanceSettingsRepository = app.get('InstanceSettingsRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Create/Update organization with ALLOW_PERSONAL_WORKSPACE=false', () => {
    describe('create organization', () => {
      it('should not allow authenticated users to create organization', async () => {
        const { user: userData } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        await request(app.getHttpServer())
          .post('/api/organizations')
          .set('Authorization', authHeaderForUser(userData))
          .send({ name: 'My workspace' })
          .expect(401);
      });
      it('should create new organization for super admin', async () => {
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
        });
        await request(app.getHttpServer())
          .post('/api/organizations')
          .set('Authorization', authHeaderForUser(superAdminUserData.user))
          .send({ name: 'My workspace' })
          .expect(201);
      });
    });

    describe('update organization', () => {
      it('should not change organization name if changes are done by user/admin', async () => {
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });

        const response = await request(app.getHttpServer())
          .patch('/api/organizations/name')
          .send({ name: 'new name' })
          .set('Authorization', authHeaderForUser(user, organization.id));

        expect(response.statusCode).toBe(403);
      });

      it('should change organization name if changes are done by super admin', async () => {
        const { organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
        });
        const response = await request(app.getHttpServer())
          .patch('/api/organizations/name')
          .send({ name: 'new name' })
          .set('Authorization', authHeaderForUser(superAdminUserData.user, organization.id));

        expect(response.statusCode).toBe(200);
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
