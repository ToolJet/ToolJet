/**
 * Column defaults and SQL-mode schema names reach SQL that runs on the ToolJet Database admin
 * connection. A quote in either must stay data: a default is stored as the exact text, and a
 * schema name is refused cleanly instead of ending the SQL literal.
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

const NO_CONSTRAINTS = { is_not_null: false, is_primary_key: false, is_unique: false };
const ID_COLUMN = {
  column_name: 'id',
  data_type: 'serial',
  constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
};

describe('TooljetDb SQL escaping', () => {
  let app: INestApplication;
  let orgId: string;
  let otherOrgId: string;
  let developmentEnvironmentId: string;
  let cookie: string[];

  const asAdmin = (req: request.Test) => req.set({ Cookie: cookie, 'tj-workspace-id': orgId });
  const http = () => request.agent(app.getHttpServer());

  const createTable = async (table_name: string, columns: object[]) =>
    asAdmin(http().post(`/api/tooljet-db/organizations/${orgId}/table`)).send({
      table_name,
      columns: [ID_COLUMN, ...columns],
      foreign_keys: [],
    });

  const columnDefault = async (tableName: string, columnName: string) => {
    const res = await asAdmin(http().get(`/api/tooljet-db/organizations/${orgId}/table/${tableName}`)).expect(200);
    return res.body.result.columns.find((column) => column.column_name === columnName)?.column_default;
  };

  beforeAll(async () => {
    ({ app } = await initTestApp());

    // DDL commits on the ToolJet Database connection, so the workspace rows it reads must commit too.
    await withRealTransactions(async () => {
      const admin = await createUser(app, { email: 'tjdb-escape@tooljet.io', groups: ['admin', 'end-user'] });
      const otherAdmin = await createUser(app, {
        email: 'tjdb-escape-other@tooljet.io',
        groups: ['admin', 'end-user'],
      });
      orgId = admin.organization.id;
      otherOrgId = otherAdmin.organization.id;
      for (const id of [orgId, otherOrgId]) {
        const environments = await ensureAppEnvironments(app, id);
        if (id === orgId) developmentEnvironmentId = environments.find((env) => env.priority === 1).id;
        await app
          .get(TooljetDbTableOperationsService)
          .createTooljetDbTenantSchemaAndRole(id, getDefaultDataSource().manager);
      }
      // Each test opens a real transaction, which rolls the suite one back, so the session must commit too.
      ({ tokenCookie: cookie } = await login(app, 'tjdb-escape@tooljet.io'));
    });
  });

  afterAll(async () => {
    await withRealTransactions(async () => {
      const tableOperations = app.get(TooljetDbTableOperationsService);
      await tableOperations.deleteTooljetDbTenantSchemaAndRole(orgId);
      await tableOperations.deleteTooljetDbTenantSchemaAndRole(otherOrgId);
      await resetDB();
    });
    await closeTestApp(app);
  }, 60_000);

  describe('POST /api/tooljet-db/organizations/:organizationId/table | Column default with a quote', () => {
    it('should store a text default containing a single quote as that exact text', async () => {
      await withRealTransactions(async () => {
        const res = await createTable('quoted_text_default', [
          { column_name: 'label', data_type: 'character varying', column_default: "it's", constraints_type: {} },
        ]);

        expect(res.statusCode).toBe(201);
        expect(await columnDefault('quoted_text_default', 'label')).toBe("it's");
      });
    });

    it('should store a jsonb default whose key contains a single quote as that exact JSON', async () => {
      await withRealTransactions(async () => {
        const res = await createTable('quoted_jsonb_default', [
          { column_name: 'meta', data_type: 'jsonb', column_default: { "it's": 1 }, constraints_type: {} },
        ]);

        expect(res.statusCode).toBe(201);
        expect(await columnDefault('quoted_jsonb_default', 'meta')).toEqual({ "it's": 1 });
      });
    });
  });

  describe('POST /api/tooljet-db/organizations/:organizationId/table/:tableName/column | Column default with a quote', () => {
    it('should add the column with the exact quoted default', async () => {
      await withRealTransactions(async () => {
        await createTable('add_column_target', []).then((res) => expect(res.statusCode).toBe(201));

        const res = await asAdmin(
          http().post(`/api/tooljet-db/organizations/${orgId}/table/add_column_target/column`)
        ).send({
          column: {
            column_name: 'label',
            data_type: 'character varying',
            column_default: "it's",
            constraints_type: NO_CONSTRAINTS,
          },
        });

        expect(res.statusCode).toBe(201);
        expect(await columnDefault('add_column_target', 'label')).toBe("it's");
      });
    });
  });

  describe('PATCH /api/tooljet-db/organizations/:organizationId/table/:tableName/column | Column default with a quote', () => {
    it('should change the default to the exact quoted text', async () => {
      await withRealTransactions(async () => {
        await createTable('edit_column_target', [
          { column_name: 'label', data_type: 'character varying', column_default: 'plain', constraints_type: {} },
        ]).then((res) => expect(res.statusCode).toBe(201));

        const res = await asAdmin(
          http().patch(`/api/tooljet-db/organizations/${orgId}/table/edit_column_target/column`)
        ).send({
          column: {
            column_name: 'label',
            data_type: 'character varying',
            column_default: "o'clock",
            constraints_type: NO_CONSTRAINTS,
          },
        });

        expect(res.statusCode).toBe(200);
        expect(await columnDefault('edit_column_target', 'label')).toBe("o'clock");
      });
    });
  });

  describe('PATCH /api/tooljet-db/organizations/:organizationId/table/:tableName | Column default with a quote', () => {
    it('should change the default to the exact quoted text through edit table', async () => {
      await withRealTransactions(async () => {
        await createTable('edit_table_target', [
          { column_name: 'label', data_type: 'character varying', column_default: 'plain', constraints_type: {} },
        ]).then((res) => expect(res.statusCode).toBe(201));
        // Like the table editor: every current column, as view table returns it, diffed against its edit.
        const current = await asAdmin(
          http().get(`/api/tooljet-db/organizations/${orgId}/table/edit_table_target`)
        ).expect(200);
        // The editor sends a nextval() integer as serial, with no default (getColumnDataType).
        const asSent = ({ column_name, data_type, column_default, constraints_type }) =>
          /^nextval\(/.test(column_default ?? '')
            ? { column_name, data_type: 'serial', constraints_type }
            : { column_name, data_type, ...(column_default !== null && { column_default }), constraints_type };
        const columns = current.body.result.columns.map((column) => {
          const old_column = asSent(column);
          const new_column =
            column.column_name === 'label' ? { ...old_column, column_default: "rock'n'roll" } : old_column;
          return { old_column, new_column };
        });

        const res = await asAdmin(http().patch(`/api/tooljet-db/organizations/${orgId}/table/edit_table_target`)).send({
          table_name: 'edit_table_target',
          columns,
        });

        expect(res.statusCode).toBe(200);
        expect(await columnDefault('edit_table_target', 'label')).toBe("rock'n'roll");
      });
    });
  });

  describe('POST /api/tooljet-db/organizations/:organizationId/table/:tableId/sql | Schema named in SQL mode', () => {
    let tableId: string;

    beforeAll(async () => {
      await withRealTransactions(async () => {
        const res = await createTable('sql_mode_target', []);
        expect(res.statusCode).toBe(201);
        tableId = res.body.result.id;
      });
    });

    const runSql = (sql: string) =>
      asAdmin(http().post(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/sql`)).send({
        sql,
        environment_id: developmentEnvironmentId,
      });

    it('should refuse a schema name containing a quote as not authorized, not a SQL syntax error', async () => {
      let res: request.Response;
      await withRealTransactions(async () => {
        res = await runSql(`SELECT * FROM "a'b".{{self}}`);
      });

      expect(JSON.stringify(res.body)).not.toMatch(/syntax error/i);
      expect(JSON.stringify(res.body)).toContain('You are not authorized to perform actions on some schemas.');
    });

    it("should refuse another workspace's schema as not authorized", async () => {
      let res: request.Response;
      await withRealTransactions(async () => {
        res = await runSql(`SELECT * FROM "workspace_${otherOrgId}".{{self}}`);
      });

      expect(JSON.stringify(res.body)).toContain('You are not authorized to perform actions on some schemas.');
    });

    it("should still run SQL against the workspace's own table", async () => {
      let res: request.Response;
      await withRealTransactions(async () => {
        res = await runSql(`SELECT * FROM {{self}}`);
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({ result: { status: 'ok' } });
    });
  });
});
