import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createUser, login, ensureAppEnvironments } from 'test-helper';
import { OrganizationConstantsUtilService } from '@modules/organization-constants/util.service';
import { EncryptionService } from '@modules/encryption/service';
import { OrganizationConstantType } from '@modules/organization-constants/constants';

/** @group platform */
describe('OrganizationConstantsUtilService | resolving a constant at run time', () => {
  let app: INestApplication;
  let organizationId: string;
  let environmentId: string;
  let util: OrganizationConstantsUtilService;
  let encryption: EncryptionService;

  const create = (type: 'Global' | 'Secret', name: string, value: string, cookie: string[]) =>
    request(app.getHttpServer())
      .post('/api/organization-constants/')
      .set('tj-workspace-id', organizationId)
      .set('Cookie', cookie)
      .send({ constant_name: name, value, type, environments: [environmentId] })
      .expect(201);

  const resolve = async (name: string, type: OrganizationConstantType) => {
    const stored = await util.getOrgEnvironmentConstant(name, organizationId, environmentId, type);
    return stored && encryption.decryptColumnValue('org_environment_constant_values', organizationId, stored.value);
  };

  beforeAll(async () => {
    ({ app } = await initTestApp());
    util = app.get(OrganizationConstantsUtilService, { strict: false });
    encryption = app.get(EncryptionService, { strict: false });

    const admin = await createUser(app, { email: 'admin@tooljet.io', groups: ['admin', 'all_users'] });
    organizationId = admin.user.organizationId;
    environmentId = (await ensureAppEnvironments(app, organizationId))[0].id;
    const { tokenCookie } = await login(app);

    await create('Global', 'shared_name', 'the-global-value', tokenCookie);
    await create('Secret', 'shared_name', 'the-secret-value', tokenCookie);
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  it('should resolve a Global and a Secret that share a name to their own values', async () => {
    expect(await resolve('shared_name', OrganizationConstantType.GLOBAL)).toBe('the-global-value');
    expect(await resolve('shared_name', OrganizationConstantType.SECRET)).toBe('the-secret-value');
  });

  it('should return null for a constant that does not exist', async () => {
    expect(await resolve('missing_name', OrganizationConstantType.GLOBAL)).toBeNull();
  });
});
