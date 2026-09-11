/**
 * view_tables per-environment state: shape must be edition-agnostic - same field names in the
 * response regardless of edition, only the number of `environments` entries differs. CE (no
 * multi-environment license) gets one entry (its implicit environment); licensed EE gets one
 * entry per environment, with correct has_relation/baseline_error presence.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createUser,
  initTestApp,
  login,
  logout,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';

describe('TooljetDbController | view_tables environments', () => {
  const idColumn = {
    column_name: 'id',
    data_type: 'integer',
    constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
  };

  describe('CE (no multi-environment license)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tooljetDbAvailable: boolean;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce', plan: 'basic' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;

      await ensureAppEnvironments(app, orgId);

      if (tooljetDbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "workspace_${orgId}"`);
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tooljetDbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app));
    });

    afterEach(async () => {
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should return one environments entry, marked present, for a created table', async () => {
      expect(tooljetDbAvailable).toBe(true);

      await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(adminCookie))
        .send({ table_name: 'ce_view_tables_env', columns: [idColumn], foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));

      const listRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/tables`)
        .set(headers(adminCookie));
      expect(listRes.statusCode).toBe(200);

      const table = listRes.body.result.find((t) => t.table_name === 'ce_view_tables_env');
      expect(table).toBeTruthy();
      expect(table.environments).toHaveLength(1);
      expect(table.environments[0]).toMatchObject({
        has_relation: true,
        baseline_error: null,
      });
      expect(typeof table.environments[0].environment_id).toBe('string');
      expect(typeof table.environments[0].environment_name).toBe('string');
    });
  });

  describe('EE (plan: enterprise, multi-environment licensed)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tooljetDbAvailable: boolean;
    let devEnvId: string;
    let stagingEnvId: string;
    let productionEnvId: string;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;

      const environments = await ensureAppEnvironments(app, orgId);
      devEnvId = environments.find((e) => e.priority === 1).id;
      stagingEnvId = environments.find((e) => e.priority === 2).id;
      productionEnvId = environments.find((e) => e.priority === 3).id;

      if (tooljetDbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "workspace_${orgId}"`);
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tooljetDbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app));
    });

    afterEach(async () => {
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should return one entry per licensed environment, with per-environment presence and baseline_error flags', async () => {
      expect(tooljetDbAvailable).toBe(true);

      await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(adminCookie))
        .send({ table_name: 'ee_view_tables_env', columns: [idColumn], foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));

      const internalTable = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName: 'ee_view_tables_env' },
      });

      // create_table only materializes a relation in the source (dev) environment; mark that
      // relation's baseline as errored to prove the flag rides through per-environment, not
      // per-table.
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { internalTableId: internalTable.id, environmentId: devEnvId },
        { baselineError: 'could not baseline' }
      );

      const listRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/tables`)
        .set(headers(adminCookie));
      expect(listRes.statusCode).toBe(200);

      const table = listRes.body.result.find((t) => t.table_name === 'ee_view_tables_env');
      expect(table).toBeTruthy();
      expect(table.environments).toHaveLength(3);

      const byId = Object.fromEntries(table.environments.map((e) => [e.environment_id, e]));
      expect(byId[devEnvId]).toMatchObject({ has_relation: true, baseline_error: 'could not baseline' });
      expect(byId[stagingEnvId]).toMatchObject({ has_relation: false, baseline_error: null });
      expect(byId[productionEnvId]).toMatchObject({ has_relation: false, baseline_error: null });
    });
  });
});
