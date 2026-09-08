/**
 * Column data-type change. The three lossless widening casts go through `edit_column`; everything
 * else is rejected before any DDL runs and belongs in a raw SQL migration.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  login,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
  withRealTransactions,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';

describe('TooljetDb column type change', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let tjdbAvailable: boolean;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    // ---- helpers copied verbatim from tjdb-raw-sql-migration.spec.ts:47-95 ----
    async function setUpWorkspace() {
      const email = `type-change-${uuidv4()}@tooljet.io`;
      const { user, organization } = await createUser(app, {
        email,
        firstName: 'RawSql',
        lastName: 'Test',
        groups: ['admin', 'end-user'],
      });
      const organizationId = user.defaultOrganizationId;
      const tenantSchema = `workspace_${organizationId}`;
      await ensureAppEnvironments(app, organizationId);

      // Real provisioning, not just the schema: recordRawSqlMigration opens its own connection as
      // the tenant role, which needs a real login role and a matching OrganizationTjdbConfigurations
      // row - createUser() (unlike the real signup flow) never provisions either.
      await app
        .get(TooljetDbTableOperationsService)
        .createTooljetDbTenantSchemaAndRole(organizationId, getDefaultDataSource().manager);

      const { tokenCookie } = await login(app, email);
      return { organizationId, tenantSchema, cookie: tokenCookie, organization };
    }

    // createTooljetDbTenantSchemaAndRole provisions a cluster-level Postgres role + schema -
    // withRealTransactions only rolls back this suite's transaction, it never reclaims those.
    async function cleanupWorkspace(organizationId: string) {
      try {
        await app.get(TooljetDbTableOperationsService).deleteTooljetDbTenantSchemaAndRole(organizationId);
      } catch {
        // best-effort - a failed setup earlier in the test shouldn't mask the real failure
      }
    }

    function headers(organizationId: string, cookie: string[]) {
      return { Cookie: cookie, 'tj-workspace-id': organizationId };
    }

    async function createTable(organizationId: string, cookie: string[], tableName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table`)
        .set(headers(organizationId, cookie))
        .send({
          table_name: tableName,
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
            },
            {
              column_name: 'gpa',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          ],
          foreign_keys: [],
        });
      expect([200, 201]).toContain(res.statusCode);
    }
    // ---- end verbatim helpers ----

    async function editColumn(organizationId: string, cookie: string[], tableName: string, column: object) {
      return request
        .agent(app.getHttpServer())
        .patch(`/api/tooljet-db/organizations/${organizationId}/table/${tableName}/column`)
        .set(headers(organizationId, cookie))
        .send({ column });
    }

    async function introspectType(tenantSchema: string, relationId: string, columnName: string) {
      const [row] = await getTooljetDbDataSource().query(
        `SELECT data_type FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2 AND column_name = $3`,
        [tenantSchema, relationId, columnName]
      );
      return row?.data_type;
    }

    async function promote(organizationId: string, cookie: string[], tableId: string, sourceEnvironmentId: string) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/promote`)
        .set(headers(organizationId, cookie))
        .send({ environment_id: sourceEnvironmentId });
    }

    async function devRelationId(organizationId: string, tableName: string) {
      const manager = getDefaultDataSource().manager;
      const internalTable = await manager.findOne(InternalTable, { where: { organizationId, tableName } });
      const relations = await manager.find(InternalTableRelation, {
        where: { internalTableId: internalTable.id },
      });
      return { internalTableId: internalTable.id, relations };
    }

    it('widens integer to bigint through edit_column', async () => {
      await withRealTransactions(async () => {
        if (!tjdbAvailable) return;
        const { organizationId, tenantSchema, cookie } = await setUpWorkspace();
        try {
          await createTable(organizationId, cookie, 'inventory');
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/inventory/column`)
            .set(headers(organizationId, cookie))
            .send({ column: { column_name: 'qty', data_type: 'integer', constraints_type: {} } })
            .expect(201);

          const res = await editColumn(organizationId, cookie, 'inventory', {
            column_name: 'qty',
            data_type: 'bigint',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          });
          expect(res.status).toBe(200);

          const { relations } = await devRelationId(organizationId, 'inventory');
          for (const relation of relations) {
            const type = await introspectType(tenantSchema, relation.id, 'qty');
            // Only the dev relation has the change until promote runs.
            expect(['integer', 'bigint']).toContain(type);
          }
          const devType = await introspectType(tenantSchema, relations[0].id, 'qty');
          expect(devType).toBe('bigint');
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    });

    it('rejects a row-dependent cast before any DDL runs', async () => {
      await withRealTransactions(async () => {
        if (!tjdbAvailable) return;
        const { organizationId, tenantSchema, cookie } = await setUpWorkspace();
        try {
          await createTable(organizationId, cookie, 'customers');
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/customers/column`)
            .set(headers(organizationId, cookie))
            .send({ column: { column_name: 'amount', data_type: 'character varying', constraints_type: {} } })
            .expect(201);

          const res = await editColumn(organizationId, cookie, 'customers', {
            column_name: 'amount',
            data_type: 'integer',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          });
          expect(res.status).toBe(400);
          expect(res.body.message).toMatch(/USING clause/);

          const { relations } = await devRelationId(organizationId, 'customers');
          expect(await introspectType(tenantSchema, relations[0].id, 'amount')).toBe('character varying');
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    });

    it('refuses to retype a serial column', async () => {
      await withRealTransactions(async () => {
        if (!tjdbAvailable) return;
        const { organizationId, cookie } = await setUpWorkspace();
        try {
          // The shared createTable() helper's `id` column is a plain integer PK, not `serial` (no
          // `nextval` default) - createTable() in tjdb-promote.spec.ts's idColumn is the same shape,
          // for the same reason: neither needs an auto-incrementing id. This test does, so it builds
          // the table directly with `data_type: 'serial'`, matching tooljetdb-operations.spec.ts's
          // bulk-upload fixture.
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table`)
            .set(headers(organizationId, cookie))
            .send({
              table_name: 'tickets',
              columns: [
                {
                  column_name: 'id',
                  data_type: 'serial',
                  constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
                },
              ],
              foreign_keys: [],
            })
            .expect(201);

          const res = await editColumn(organizationId, cookie, 'tickets', {
            column_name: 'id',
            data_type: 'bigint',
            constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
          });
          expect(res.status).toBe(400);
          expect(res.body.message).toMatch(/auto-incrementing/);
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    });

    it('refuses to retype a column under a foreign key, and names the constraint', async () => {
      await withRealTransactions(async () => {
        if (!tjdbAvailable) return;
        const { organizationId, cookie } = await setUpWorkspace();
        try {
          // `parents` gets an integer primary key; `children.parent_id` points at it. Follow
          // tjdb-promote.spec.ts's `idColumn` shape and this file's createTable helper for the
          // exact create_table payload, and the POST .../foreignkey route for the constraint.
          await createTable(organizationId, cookie, 'parents');
          await createTable(organizationId, cookie, 'children');
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/children/column`)
            .set(headers(organizationId, cookie))
            .send({ column: { column_name: 'parent_id', data_type: 'integer', constraints_type: {} } })
            .expect(201);

          const fkRes = await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/children/foreignkey`)
            .set(headers(organizationId, cookie))
            .send({
              foreign_keys: [
                {
                  column_names: ['parent_id'],
                  referenced_table_name: 'parents',
                  referenced_column_names: ['id'],
                  on_delete: 'NO ACTION',
                  on_update: 'NO ACTION',
                },
              ],
            });
          // If this payload shape is wrong, read the create-foreign-key request built by
          // frontend/src/_services/tooljetDatabase.service.js and match it exactly.
          expect([200, 201]).toContain(fkRes.status);

          const res = await editColumn(organizationId, cookie, 'children', {
            column_name: 'parent_id',
            data_type: 'bigint',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          });
          expect(res.status).toBe(400);
          expect(res.body.message).toMatch(/foreign key/);
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    });

    it('clears the column display settings when the type changes', async () => {
      await withRealTransactions(async () => {
        if (!tjdbAvailable) return;
        const { organizationId, cookie } = await setUpWorkspace();
        try {
          await createTable(organizationId, cookie, 'events');
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/events/column`)
            .set(headers(organizationId, cookie))
            .send({ column: { column_name: 'seq', data_type: 'integer', constraints_type: {} } })
            .expect(201);

          const manager = getDefaultDataSource().manager;
          const { internalTableId, relations } = await devRelationId(organizationId, 'events');
          const dev = relations[0];
          const columnUuid = dev.configurations.columns.column_names['seq'];
          dev.configurations.columns.configurations[columnUuid] = { timezone: 'UTC' };
          dev.configurations = { columns: dev.configurations.columns };
          await manager.save(dev);

          await editColumn(organizationId, cookie, 'events', {
            column_name: 'seq',
            data_type: 'bigint',
            constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
          }).then((res) => expect(res.status).toBe(200));

          const reloaded = await manager.findOne(InternalTableRelation, { where: { id: dev.id } });
          expect(reloaded.configurations.columns.configurations[columnUuid]).toEqual({});
          expect(internalTableId).toBeTruthy();
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    });

    it('fails a promote at the offending migration and stays resumable', async () => {
      await withRealTransactions(async () => {
        if (!tjdbAvailable) return;
        const { organizationId, tenantSchema, cookie } = await setUpWorkspace();
        try {
          await createTable(organizationId, cookie, 'orders');
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/orders/column`)
            .set(headers(organizationId, cookie))
            .send({ column: { column_name: 'amount', data_type: 'character varying', constraints_type: {} } })
            .expect(201);

          const manager = getDefaultDataSource().manager;
          const internalTable = await manager.findOne(InternalTable, {
            where: { organizationId, tableName: 'orders' },
          });
          // environmentId is a random UUID FK, not priority-ordered - resolve development explicitly
          // via AppEnvironment.priority (DEVELOPMENT_PRIORITY = 1), as relation-resolver.service.ts does.
          const environments = await manager.find(AppEnvironment, {
            where: { organizationId },
            order: { priority: 'ASC' },
          });
          const devEnvId = environments[0].id;
          let relations = await manager.find(InternalTableRelation, {
            where: { internalTableId: internalTable.id },
          });
          const devRelation = relations.find((relation) => relation.environmentId === devEnvId);
          expect(devRelation).toBeTruthy();

          // The target's relation doesn't exist until the first promote creates it - promote once
          // while both sides are clean to get a target row to dirty.
          const seedPromote = await promote(organizationId, cookie, internalTable.id, devRelation.environmentId);
          expect([200, 201]).toContain(seedPromote.status);
          relations = await manager.find(InternalTableRelation, { where: { internalTableId: internalTable.id } });
          const targetRelation = relations.find((relation) => relation.environmentId !== devEnvId);
          expect(targetRelation).toBeTruthy();

          // Dev is clean; the promote target is not. This is the ordinary shape of the problem, not
          // a contrived one. createTable()'s `id` column is a plain integer PK with no default, so
          // every insert must supply one.
          const tjdb = getTooljetDbDataSource();
          await tjdb.query(`INSERT INTO "${tenantSchema}"."${devRelation.id}" ("id", "amount") VALUES (1, '12')`);
          await tjdb.query(`INSERT INTO "${tenantSchema}"."${targetRelation.id}" ("id", "amount") VALUES (1, 'n/a')`);

          // The cast is a raw SQL migration, exactly as the frontend generator produces it. {{self}}
          // substitutes the bare relation id, so it must be quoted like every other identifier.
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/${internalTable.id}/migrations/sql`)
            .set(headers(organizationId, cookie))
            .send({
              sql: `ALTER TABLE "{{self}}" ALTER COLUMN "amount" TYPE integer USING "amount"::integer;`,
              refs: {},
            })
            .expect(201);

          const devType = await introspectType(tenantSchema, devRelation.id, 'amount');
          expect(devType).toBe('integer');

          // Promote from dev onto the dirty target: expect a clean failure, and the target untouched.
          const failed = await promote(organizationId, cookie, internalTable.id, devRelation.environmentId);
          expect(failed.status).toBeGreaterThanOrEqual(400);

          const targetType = await introspectType(tenantSchema, targetRelation.id, 'amount');
          expect(targetType).toBe('character varying');

          // Resumable: fix the data, promote again, and it goes through.
          await tjdb.query(`UPDATE "${tenantSchema}"."${targetRelation.id}" SET "amount" = '0'`);
          const retried = await promote(organizationId, cookie, internalTable.id, devRelation.environmentId);
          expect([200, 201]).toContain(retried.status);
          expect(await introspectType(tenantSchema, targetRelation.id, 'amount')).toBe('integer');
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    }, 120_000);

    it('promotes a safe-tier cast using the exact SQL buildTypeChangeSql generates', async () => {
      await withRealTransactions(async () => {
        if (!tjdbAvailable) return;
        const { organizationId, tenantSchema, cookie } = await setUpWorkspace();
        try {
          await createTable(organizationId, cookie, 'products');
          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/products/column`)
            .set(headers(organizationId, cookie))
            .send({ column: { column_name: 'sku', data_type: 'integer', constraints_type: {} } })
            .expect(201);

          const { relations: seedRelations } = await devRelationId(organizationId, 'products');
          const devEnvId = seedRelations[0].environmentId;
          const seedPromote = await promote(organizationId, cookie, seedRelations[0].internalTableId, devEnvId);
          expect([200, 201]).toContain(seedPromote.status);
          const { relations } = await devRelationId(organizationId, 'products');
          const devRelation = relations.find((relation) => relation.environmentId === devEnvId);
          const targetRelation = relations.find((relation) => relation.environmentId !== devEnvId);

          // Verbatim output of buildTypeChangeSql({ columnName: 'sku', targetType: 'character varying',
          // hasDefault: false }) (frontend/src/TooljetDatabase/columnTypeChange.js), confirmed by
          // running that function directly - not hand-derived. This is the `safe`-tier, no-default
          // shape the raw_sql-generated type-change path was never exercised against before {{self}}
          // was quoted (Finding 1): an unquoted `{{self}}` here would fail to parse as an identifier.
          const generatedSql = `ALTER TABLE "{{self}}" ALTER COLUMN "sku" TYPE character varying USING "sku"::character varying;`;

          await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${organizationId}/table/${devRelation.internalTableId}/migrations/sql`)
            .set(headers(organizationId, cookie))
            .send({ sql: generatedSql, refs: {} })
            .expect(201);

          expect(await introspectType(tenantSchema, devRelation.id, 'sku')).toBe('character varying');

          const promoted = await promote(organizationId, cookie, devRelation.internalTableId, devEnvId);
          expect([200, 201]).toContain(promoted.status);
          expect(await introspectType(tenantSchema, targetRelation.id, 'sku')).toBe('character varying');
        } finally {
          await cleanupWorkspace(organizationId);
        }
      });
    }, 120_000);
  });
});
