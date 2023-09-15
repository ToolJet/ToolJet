import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstance, authenticateUser } from '../../test.helper';
import { Repository } from 'typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';

describe('organizations controller', () => {
  let app: INestApplication;
  let instanceSettingsRepository: Repository<InstanceSettings>;

  beforeEach(async () => {
    await clearDB();
    await instanceSettingsRepository.update(
      { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
      { value: 'false' }
    );
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
        const loggedUser = await authenticateUser(app, userData.email);
        await request(app.getHttpServer())
          .post('/api/organizations')
          .set('tj-workspace-id', userData.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'My workspace' })
          .expect(403);
      });
      it('should create new organization for super admin', async () => {
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
        });
        const loggedUser = await authenticateUser(app, superAdminUserData.user.email);
        await request(app.getHttpServer())
          .post('/api/organizations')
          .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie)
          .send({ name: 'My workspace' })
          .expect(201);
      });
    });

    describe('update organization', () => {
      it('should not change organization name if changes are done by user/admin', async () => {
        const { user, organization } = await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const loggedUser = await authenticateUser(app, user.email);
        const response = await request(app.getHttpServer())
          .patch('/api/organizations/name')
          .send({ name: 'new name' })
          .set('tj-workspace-id', organization.id)
          .set('Cookie', loggedUser.tokenCookie);
        expect(response.statusCode).toBe(403);
      });

      it('should change organization name if changes are done by super admin', async () => {
        await createUser(app, {
          email: 'admin@tooljet.io',
        });
        const superAdminUserData = await createUser(app, {
          email: 'superadmin@tooljet.io',
          userType: 'instance',
        });
        const loggedUser = await authenticateUser(app, superAdminUserData.user.email);
        const response = await request(app.getHttpServer())
          .patch('/api/organizations/name')
          .send({ name: 'new name' })
          .set('tj-workspace-id', superAdminUserData.user.defaultOrganizationId)
          .set('Cookie', loggedUser.tokenCookie);

        expect(response.statusCode).toBe(200);
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
