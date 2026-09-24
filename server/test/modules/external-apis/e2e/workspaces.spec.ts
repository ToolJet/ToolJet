import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, createUser, createGroupPermission, getDefaultDataSource } from 'test-helper';
import { Organization } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';

/**
 * External API — GET /ext/workspaces
 *
 * Lists all active workspaces (organizations) with their custom groups only
 * (default/role groups are excluded from the `groups` field).
 * Tested cases:
 *   - Auth: missing header, wrong token
 *   - Happy path: response shape, custom-group-only filtering
 *   - Archived workspaces are excluded from the list
 */

/** @group platform */
describe('External API — GET /ext/workspaces', () => {
  let app: INestApplication;
  let AUTH_HEADER: string;
  let orgRepo: Repository<Organization>;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    AUTH_HEADER = `Basic ${app.get(ConfigService).get('EXTERNAL_API_ACCESS_TOKEN')}`;
    orgRepo = getDefaultDataSource().getRepository(Organization);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('auth', () => {
    it('returns 403 when Authorization header is missing', async () => {
      await request(app.getHttpServer()).get('/api/ext/workspaces').expect(403);
    });

    it('returns 403 when the access token is wrong', async () => {
      await request(app.getHttpServer())
        .get('/api/ext/workspaces')
        .set('Authorization', 'Basic wrong-token')
        .expect(403);
    });
  });

  describe('happy path', () => {
    it('lists the seeded workspace with id, name, status, groups shape', async () => {
      const { organization } = await createUser(app, { email: `ws-list-${Date.now()}@tooljet.io` });

      const res = await request(app.getHttpServer())
        .get('/api/ext/workspaces')
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const entry = res.body.find((ws: any) => ws.id === organization.id);
      expect(entry).toBeDefined();
      expect(entry).toMatchObject({ id: organization.id, name: organization.name, status: 'active' });
      expect(Array.isArray(entry.groups)).toBe(true);
    });

    it('includes only custom groups in the groups field, excluding default role groups', async () => {
      const { organization } = await createUser(app, { email: `ws-groups-${Date.now()}@tooljet.io` });
      const customGroup = await createGroupPermission(app, {
        name: `custom-${Date.now()}`,
        organizationId: organization.id,
      });

      const res = await request(app.getHttpServer())
        .get('/api/ext/workspaces')
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      const entry = res.body.find((ws: any) => ws.id === organization.id);
      const groupNames = entry.groups.map((g: any) => g.name);
      expect(groupNames).toContain(customGroup.name);
      expect(groupNames).not.toEqual(expect.arrayContaining(['admin', 'builder', 'end-user']));
      entry.groups.forEach((g: any) => expect(g.type).toBe('custom'));
    });

    it('excludes archived workspaces from the list', async () => {
      const { organization } = await createUser(app, { email: `ws-archived-${Date.now()}@tooljet.io` });
      await orgRepo.update(organization.id, { status: 'archived' });

      const res = await request(app.getHttpServer())
        .get('/api/ext/workspaces')
        .set('Authorization', AUTH_HEADER)
        .expect(200);

      expect(res.body.find((ws: any) => ws.id === organization.id)).toBeUndefined();
    });
  });
});
