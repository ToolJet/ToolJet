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

describe('TooljetDb table migrations', () => {
  describe('CE', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
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
      ({ app } = await initTestApp({ edition: 'ce' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'table-migrations-admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
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
      const migrationIds = migrations.map((m: any) => m.id);

      const devState = environments.find((e: any) => e.environment_id === devEnvId);
      const stagingState = environments.find((e: any) => e.environment_id === stagingEnvId);

      expect(devState).toMatchObject({ environment_name: 'development', baseline_error: null });
      expect(devState.applied_migration_ids.sort()).toEqual([...migrationIds].sort());

      // Never promoted: staging has no relation at all, so nothing is confirmed applied there and
      // it carries no baseline error of its own.
      expect(
        await getDefaultDataSource().manager.findOne(InternalTableRelation, {
          where: { internalTableId: tableId, environmentId: stagingEnvId },
        })
      ).toBeNull();
      expect(stagingState).toMatchObject({
        environment_name: 'staging',
        applied_migration_ids: [],
        baseline_error: null,
      });
    });

    it('should 404 when the table does not exist in the caller organization', async () => {
      expect(tjdbAvailable).toBe(true);
      const res = await tableMigrations(adminCookie, '00000000-0000-0000-0000-000000000000');
      expect(res.statusCode).toBe(404);
    });
  });
});
