/**
 * Per-table migration history e2e: the full migration chain plus, per environment, which of those
 * migrations are confirmed applied there — reusing `computeMissingMigrations` for "applied", never a
 * second way to derive it — and that table's baseline-skip reason if it has one. Pure read, like
 * baseline-report, tested against CE directly.
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
import { Organization } from '@entities/organization.entity';

describe('TooljetDb table migrations', () => {
  describe('CE', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let organization: Organization;
    let tenantSchema: string;
    let tjdbAvailable: boolean;
    let devEnvId: string;
    let stagingEnvId: string;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    const idColumn = {
      column_name: 'id',
      data_type: 'integer',
      constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
    };

    async function createTable(cookie: string[], tableName: string, columns: any[]) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(cookie))
        .send({ table_name: tableName, columns, foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));
    }

    async function internalTableId(tableName: string): Promise<string> {
      const row = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName },
      });
      return row.id;
    }

    async function tableMigrations(cookie: string[], tableId: string) {
      return request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/migrations`)
        .set(headers(cookie));
    }

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce', plan: 'basic' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user, organization: org } = await createUser(app, {
        email: 'table-migrations-admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      organization = org;
      tenantSchema = `workspace_${orgId}`;

      const environments = await ensureAppEnvironments(app, orgId);
      devEnvId = environments.find((e) => e.priority === 1).id;
      stagingEnvId = environments.find((e) => e.priority === 2).id;

      if (tjdbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "${tenantSchema}"`);

          // `createUser` bypasses SetupOrganizationsUtilService.create() (the real onboarding path
          // that calls createTooljetDbTenantSchemaAndRole), so the tenant role needs provisioning
          // here for create_table to succeed.
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tjdbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app, 'table-migrations-admin@tooljet.io'));
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should show the full chain applied on development and the gap on staging when the table has never been promoted', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable(adminCookie, 'behind_tbl', [idColumn]);
      const tableId = await internalTableId('behind_tbl');

      await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table/behind_tbl/column`)
        .set(headers(adminCookie))
        .send({
          column: {
            column_name: 'title',
            data_type: 'character varying',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          },
        })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));

      const res = await tableMigrations(adminCookie, tableId);
      expect(res.statusCode).toBe(200);

      const { migrations, environments } = res.body.result;

      // create_table + add_column, in order.
      expect(migrations).toHaveLength(2);
      expect(migrations.map((m: any) => m.kind)).toEqual(['structured', 'structured']);
      expect(migrations[0].sql).toBe('CREATE TABLE behind_tbl (\n  id integer NOT NULL\n);');
      expect(migrations[1].sql).toBe('ALTER TABLE behind_tbl\n  ADD COLUMN title character varying;');
      const migrationIds = migrations.map((m: any) => m.id);

      // CE is unlicensed for MULTI_ENVIRONMENT, same filter view_tables applies: only the
      // priority-1 (development) environment is exposed, even though staging's app_environments
      // row exists in the DB.
      expect(environments).toHaveLength(1);
      const devState = environments.find((e: any) => e.environment_id === devEnvId);

      expect(devState).toMatchObject({ environment_name: 'development', baseline_error: null });
      expect(devState.applied_migration_ids.sort()).toEqual([...migrationIds].sort());
      expect(environments.find((e: any) => e.environment_id === stagingEnvId)).toBeUndefined();
    });

    it('should 404 when the table does not exist in the caller organization', async () => {
      expect(tjdbAvailable).toBe(true);
      const res = await tableMigrations(adminCookie, '00000000-0000-0000-0000-000000000000');
      expect(res.statusCode).toBe(404);
    });

    it('should surface a non-null baseline_error reason on the environment that carries it', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable(adminCookie, 'baseline_error_tbl', [idColumn]);
      const tableId = await internalTableId('baseline_error_tbl');

      // The development relation still works - carrying a baseline_error doesn't remove it - so
      // this is the one route the frontend reads the reason from for the migration-history view.
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { internalTableId: tableId, environmentId: devEnvId },
        { baselineError: 'could not baseline' }
      );

      const res = await tableMigrations(adminCookie, tableId);
      expect(res.statusCode).toBe(200);

      const devState = res.body.result.environments.find((e: any) => e.environment_id === devEnvId);
      expect(devState).toMatchObject({ baseline_error: 'could not baseline' });
    });

    it('lets a builder without tjdb_crud read the migration history', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable(adminCookie, 'migrations_gate_tbl', [idColumn]);
      const tableId = await internalTableId('migrations_gate_tbl');

      await createUser(
        app,
        {
          email: 'table-migrations-no-crud@tooljet.io',
          firstName: 'NoCrud',
          lastName: 'User',
          groups: ['end-user'],
          organization,
        },
        undefined
      );
      const { tokenCookie: noCrudCookie } = await login(app, 'table-migrations-no-crud@tooljet.io');

      try {
        const res = await tableMigrations(noCrudCookie, tableId);
        expect(res.statusCode).toBe(200);
      } finally {
        await logout(app, noCrudCookie, orgId);
      }
    });
  });

  describe('EE (plan: enterprise, multi-environment licensed)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tenantSchema: string;
    let tjdbAvailable: boolean;
    let devEnvId: string;
    let stagingEnvId: string;
    let productionEnvId: string;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    const idColumn = {
      column_name: 'id',
      data_type: 'integer',
      constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
    };

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'table-migrations-ee-admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      tenantSchema = `workspace_${orgId}`;

      const environments = await ensureAppEnvironments(app, orgId);
      devEnvId = environments.find((e) => e.priority === 1).id;
      stagingEnvId = environments.find((e) => e.priority === 2).id;
      productionEnvId = environments.find((e) => e.priority === 3).id;

      if (tjdbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "${tenantSchema}"`);
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tjdbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app, 'table-migrations-ee-admin@tooljet.io'));
    });

    afterEach(async () => {
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('lists all three licensed environments, applied set on development, empty and errorless on the never-promoted ones', async () => {
      expect(tjdbAvailable).toBe(true);

      await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(adminCookie))
        .send({ table_name: 'ee_migrations_tbl', columns: [idColumn], foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));

      const internalTable = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName: 'ee_migrations_tbl' },
      });

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/${internalTable.id}/migrations`)
        .set(headers(adminCookie));
      expect(res.statusCode).toBe(200);

      const { migrations, environments } = res.body.result;
      expect(environments).toHaveLength(3);
      const migrationIds = migrations.map((m: any) => m.id);

      const byId = Object.fromEntries(environments.map((e: any) => [e.environment_id, e]));
      expect(byId[devEnvId]).toMatchObject({ environment_name: 'development', baseline_error: null });
      expect(byId[devEnvId].applied_migration_ids.sort()).toEqual([...migrationIds].sort());
      expect(byId[stagingEnvId]).toMatchObject({ applied_migration_ids: [], baseline_error: null });
      expect(byId[productionEnvId]).toMatchObject({ applied_migration_ids: [], baseline_error: null });
    });
  });
});
