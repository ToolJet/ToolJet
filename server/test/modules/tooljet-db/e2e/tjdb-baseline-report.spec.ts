/**
 * Baseline report e2e: lists relations carrying `baseline_error`, the un-actioned counterpart to
 * baseline repair. Pure read — asserts only errored tables surface, clean ones don't.
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

describe('TooljetDb baseline report', () => {
  // No licence split — like baseline repair, this is a plain read gated on tjdb_crud, tested
  // against CE directly.
  describe('CE', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tenantSchema: string;
    let tjdbAvailable: boolean;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    async function createTable(cookie: string[], tableName: string, columns: any[]) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(cookie))
        .send({ table_name: tableName, columns, foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));
    }

    async function report(cookie: string[]) {
      return request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/baseline-report`)
        .set(headers(cookie));
    }

    const idColumn = {
      column_name: 'id',
      data_type: 'integer',
      constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
    };

    async function internalTableId(tableName: string): Promise<string> {
      const row = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName },
      });
      return row.id;
    }

    async function relationFor(tableId: string): Promise<InternalTableRelation> {
      return getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
        where: { internalTableId: tableId },
      });
    }

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'baseline-report-admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      tenantSchema = `workspace_${orgId}`;
      await ensureAppEnvironments(app, orgId);

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

      ({ tokenCookie: adminCookie } = await login(app, 'baseline-report-admin@tooljet.io'));
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should list only tables whose relation carries a baseline_error, with the reason intact', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable(adminCookie, 'clean_tbl', [idColumn]);
      await createTable(adminCookie, 'errored_tbl', [idColumn]);

      const erroredTableId = await internalTableId('errored_tbl');
      const erroredRelation = await relationFor(erroredTableId);

      // Simulate the rollout's failure the same way tjdb-baseline-repair.spec.ts does: a relation
      // recorded with baseline_error, independent of whether the physical table is actually broken.
      await getDefaultDataSource().manager.update(
        InternalTableRelation,
        { id: erroredRelation.id },
        { baselineError: 'transient failure, needs repair' }
      );

      const res = await report(adminCookie);
      expect(res.statusCode).toBe(200);

      const rows = res.body.result;
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        table_id: erroredTableId,
        table_name: 'errored_tbl',
        baseline_error: 'transient failure, needs repair',
      });
      expect(rows.some((row: any) => row.table_name === 'clean_tbl')).toBe(false);
    });
  });
});
