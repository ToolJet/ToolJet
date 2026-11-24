/**
 * A table's migration history carries each migration's SQL, so only schema editors may read it.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createUser,
  ensureAppEnvironments,
  initTestApp,
  login,
  closeTestApp,
  getDefaultDataSource,
  resetDB,
  withRealTransactions,
} from 'test-helper';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';

describe('TooljetDb table migrations access', () => {
  let app: INestApplication;
  let orgId: string;
  let tableId: string;
  const cookies: Record<'admin' | 'builder' | 'endUser', string[]> = { admin: [], builder: [], endUser: [] };

  const getMigrations = (who: keyof typeof cookies) =>
    request
      .agent(app.getHttpServer())
      .get(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/migrations`)
      .set({ Cookie: cookies[who], 'tj-workspace-id': orgId });

  beforeAll(async () => {
    ({ app } = await initTestApp());

    // Table creation commits DDL on its own connection, so the seed commits for real.
    await withRealTransactions(async () => {
      const admin = await createUser(app, { email: 'tjdb-migrations-admin@tooljet.io', groups: ['admin', 'end-user'] });
      orgId = admin.organization.id;
      await createUser(app, {
        email: 'tjdb-migrations-builder@tooljet.io',
        groups: ['builder'],
        organization: admin.organization,
      });
      await createUser(app, {
        email: 'tjdb-migrations-end-user@tooljet.io',
        groups: ['end-user'],
        organization: admin.organization,
      });
      await ensureAppEnvironments(app, orgId);
      await app
        .get(TooljetDbTableOperationsService)
        .createTooljetDbTenantSchemaAndRole(orgId, getDefaultDataSource().manager);

      ({ tokenCookie: cookies.admin } = await login(app, 'tjdb-migrations-admin@tooljet.io'));
      ({ tokenCookie: cookies.builder } = await login(app, 'tjdb-migrations-builder@tooljet.io'));
      ({ tokenCookie: cookies.endUser } = await login(app, 'tjdb-migrations-end-user@tooljet.io'));

      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set({ Cookie: cookies.admin, 'tj-workspace-id': orgId })
        .send({
          table_name: 'migrations_target',
          columns: [
            {
              column_name: 'id',
              data_type: 'serial',
              constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
            },
          ],
          foreign_keys: [],
        })
        .expect(201);
      tableId = res.body.result.id;
    });
  });

  afterAll(async () => {
    await withRealTransactions(async () => {
      await app.get(TooljetDbTableOperationsService).deleteTooljetDbTenantSchemaAndRole(orgId);
      await resetDB();
    });
    await closeTestApp(app);
  }, 60_000);

  describe('GET /api/tooljet-db/organizations/:organizationId/table/:tableId/migrations | caller role', () => {
    it('should 403 an end user and return no migration SQL', async () => {
      const res = await getMigrations('endUser');

      expect(res.statusCode).toBe(403);
      expect(JSON.stringify(res.body)).not.toMatch(/CREATE TABLE/i);
    });

    it.each([['builder'], ['admin']] as const)('should return the migration SQL to a %s', async (who) => {
      const res = await getMigrations(who);

      expect(res.statusCode).toBe(200);
      expect(JSON.stringify(res.body)).toMatch(/CREATE TABLE/i);
    });
  });
});
