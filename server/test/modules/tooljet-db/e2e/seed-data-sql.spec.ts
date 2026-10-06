/**
 * Acceptance spec for the "Seed data with SQL" route: a thin wrapper around the existing
 * TooljetDbDataOperationsService.sqlExecution, needing a real tenant Postgres role/schema
 * (hence `withRealTransactions` below), same as the other raw-SQL specs in this folder.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  initTestApp,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  withRealTransactions,
  setUpTjdbWorkspace,
  cleanupTjdbWorkspace,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { TooljetDbDataOperationsService } from '@ee/tooljet-db/services/tooljet-db-data-operations.service';

describe('TooljetDb seed data with SQL - POST table/:tableId/sql', () => {
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
      const internalTable = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName },
      });
      return internalTable.id;
    }

    // verifyTablesExistInWorkspace resolves table references in the SQL text by table_name, not
    // by id - sqlExecution expects display names in the query, the same as it does when run from
    // Query Manager.

    function runSql(
      organizationId: string,
      cookie: string[],
      tableId: string,
      body: { sql: string; environment_id: string }
    ) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table/${tableId}/sql`)
        .set(headers(organizationId, cookie))
        .send(body);
    }

    it('should insert a row and make it readable via the proxy when run by an admin', async () => {
      if (!tjdbAvailable) return;
      let organizationId: string | undefined;
      try {
        // sqlExecution authenticates to Postgres as the tenant role directly (a fresh connection,
        // not the suite's shared pool) - that role only exists once createTooljetDbTenantSchemaAndRole's
        // CREATE ROLE actually commits, so this needs a real transaction, same as
        // raw-sql-migrations.e2e-spec.ts's tenant-role tests.
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'seed-data-sql', groups: ['admin', 'end-user'] });
          organizationId = workspace.organizationId;
          const { cookie, environments } = workspace;

          const tableName = `seed_sql_${uuidv4().slice(0, 8)}`;
          const tableId = await createTable(organizationId, cookie, tableName);
          // priority 1 = development (defaultAppEnvironments in utils.helper.ts) - isDefault is set
          // on production instead, and a freshly-created table only has a relation in development.
          const devEnvironment = environments.find((env) => env.priority === 1) ?? environments[0];

          const res = await runSql(organizationId, cookie, tableId, {
            sql: `INSERT INTO "{{self}}" (id, gpa) VALUES (1, '3.9')`,
            environment_id: devEnvironment.id,
          });
          expect(res.statusCode).toBe(201);

          const readRes = await request
            .agent(app.getHttpServer())
            .get(`/api/tooljet-db/proxy/${tableId}`)
            .set(headers(organizationId, cookie));
          expect(readRes.statusCode).toBe(200);
          expect(readRes.body).toMatchObject([{ id: 1, gpa: '3.9' }]);
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    it('should reject a non-builder end user with 403', async () => {
      if (!tjdbAvailable) return;
      let organizationId: string | undefined;
      try {
        await withRealTransactions(async () => {
          const workspace = await setUpTjdbWorkspace(app, { prefix: 'seed-data-sql', groups: ['end-user'] });
          organizationId = workspace.organizationId;
          const { cookie, environments } = workspace;

          const res = await runSql(organizationId, cookie, uuidv4(), {
            sql: 'SELECT 1',
            environment_id: environments[0].id,
          });
          expect(res.statusCode).toBe(403);
        });
      } finally {
        if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
      }
    });

    // Exercises seedDataSqlExecution directly - the service method behind the POST .../sql route
    // above. These enforcement rules (self-only {{self}}, refusing {{table.<name>}} and any
    // second literal table) live below the controller layer the its above already cover.
    describe('seedDataSqlExecution | self-only enforcement', () => {
      async function createTestTable(organizationId: string, cookie: string[], tableName: string): Promise<string> {
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
                column_name: 'name',
                data_type: 'character varying',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
            ],
            foreign_keys: [],
          });
        expect([200, 201]).toContain(res.statusCode);
        const internalTableId = res.body?.result?.id;
        expect(internalTableId).toBeDefined();
        return internalTableId;
      }

      async function createProdRelation(
        productionEnv: { id: string },
        internalTableId: string
      ): Promise<{ devRelation: InternalTableRelation; prodRelation: InternalTableRelation }> {
        const defaultManager = getDefaultDataSource().manager;
        const devRelation = await defaultManager.findOneOrFail(InternalTableRelation, { where: { internalTableId } });
        const prodRelation = await defaultManager.save(
          defaultManager.create(InternalTableRelation, {
            id: uuidv4(),
            internalTableId,
            environmentId: productionEnv.id,
            branchId: devRelation.branchId,
          })
        );
        return { devRelation, prodRelation };
      }

      // A promoted relation is otherwise just a metadata row - mint a real physical table behind
      // it (mirroring what create_table does for development), since seedDataSqlExecution runs
      // real SQL against it.
      async function promoteToProduction(
        organizationId: string,
        productionEnv: { id: string },
        internalTableId: string,
        prodRowName: string
      ) {
        const tjds = getTooljetDbDataSource();
        const schema = `workspace_${organizationId}`;

        const { devRelation, prodRelation } = await createProdRelation(productionEnv, internalTableId);

        await tjds.query(`CREATE TABLE "${schema}"."${prodRelation.id}" (id integer primary key, name varchar)`);
        await tjds.query(`INSERT INTO "${schema}"."${prodRelation.id}" (id, name) VALUES (1, $1)`, [prodRowName]);
        // The development relation's table already exists (create_table minted it) - seed it with
        // a row that must never surface once production is what's named.
        await tjds.query(`INSERT INTO "${schema}"."${devRelation.id}" (id, name) VALUES (1, $1)`, [
          `dev-${prodRowName}`,
        ]);

        return { devRelation, prodRelation };
      }

      it('should run a self-scoped insert when the SQL uses {{self}}', async () => {
        if (!tjdbAvailable) return;
        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'seed-sql-self' });
            organizationId = workspace.organizationId;
            const { productionEnv } = workspace;
            const tableName = `test_seed_self_${Date.now()}`;
            const internalTableId = await createTestTable(organizationId, workspace.cookie, tableName);
            const { devRelation, prodRelation } = await promoteToProduction(
              organizationId,
              productionEnv,
              internalTableId,
              'x'
            );

            const dataOperationsService = app.get(TooljetDbDataOperationsService);
            const result = await dataOperationsService.seedDataSqlExecution(
              organizationId,
              internalTableId,
              productionEnv.id,
              `INSERT INTO {{self}} (id, name) VALUES (2, 'SeededRow')`
            );
            expect(result.status).toBe('ok');

            // Row must land in the *production* relation the insert targeted, not the
            // development one seeded by promoteToProduction - proves environment_id, not just
            // {{self}}, resolved correctly.
            const tjds = getTooljetDbDataSource();
            const schema = `workspace_${organizationId}`;
            const prodRows = await tjds.query(`SELECT name FROM "${schema}"."${prodRelation.id}" WHERE id = 2`);
            expect(prodRows.map((row) => row.name)).toEqual(['SeededRow']);

            const devRows = await tjds.query(`SELECT name FROM "${schema}"."${devRelation.id}" WHERE id = 2`);
            expect(devRows).toHaveLength(0);
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should reject SQL missing the {{self}} placeholder', async () => {
        if (!tjdbAvailable) return;
        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'seed-sql-noself' });
            organizationId = workspace.organizationId;
            const { productionEnv } = workspace;
            const tableName = `seed_noself_${Date.now()}`;
            const internalTableId = await createTestTable(organizationId, workspace.cookie, tableName);

            const dataOperationsService = app.get(TooljetDbDataOperationsService);
            await expect(
              dataOperationsService.seedDataSqlExecution(
                organizationId,
                internalTableId,
                productionEnv.id,
                `INSERT INTO ${tableName} (id, name) VALUES (2, 'x')`
              )
            ).rejects.toThrow('{{self}}');
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should reject {{table.<name>}} in seed-data SQL', async () => {
        if (!tjdbAvailable) return;
        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'seed-sql-tblref' });
            organizationId = workspace.organizationId;
            const { productionEnv } = workspace;
            const tableName = `seed_tblref_${Date.now()}`;
            const internalTableId = await createTestTable(organizationId, workspace.cookie, tableName);

            const dataOperationsService = app.get(TooljetDbDataOperationsService);
            await expect(
              dataOperationsService.seedDataSqlExecution(
                organizationId,
                internalTableId,
                productionEnv.id,
                `INSERT INTO {{self}} (id) SELECT id FROM {{table.other_tbl}}`
              )
            ).rejects.toThrow('{{table.<name>}}');
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });

      it('should reject SQL that reaches a second, literally-named table', async () => {
        if (!tjdbAvailable) return;
        let organizationId: string | undefined;
        try {
          await withRealTransactions(async () => {
            const workspace = await setUpTjdbWorkspace(app, { prefix: 'seed-sql-scpother' });
            organizationId = workspace.organizationId;
            const { productionEnv } = workspace;
            const selfTableName = `seed_scpself_${Date.now()}`;
            const otherTableName = `seed_scpother_${Date.now()}`;
            const internalTableId = await createTestTable(organizationId, workspace.cookie, selfTableName);
            await createTestTable(organizationId, workspace.cookie, otherTableName);

            const dataOperationsService = app.get(TooljetDbDataOperationsService);
            await expect(
              dataOperationsService.seedDataSqlExecution(
                organizationId,
                internalTableId,
                productionEnv.id,
                `INSERT INTO {{self}} (id) SELECT id FROM ${otherTableName}`
              )
            ).rejects.toThrow('may only reference');
          });
        } finally {
          if (organizationId) await cleanupTjdbWorkspace(app, organizationId);
        }
      });
    });
  });
});
