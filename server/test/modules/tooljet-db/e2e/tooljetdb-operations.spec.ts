/**
 * ToolJet Database Table Operations E2E Tests
 *
 * Tests table-level DDL operations: create, list, and delete tables.
 * End-user role denial is also verified.
 *
 * NOTE: The ToolJet DB requires a separate PostgreSQL connection (tooljetDb)
 * **and** a per-workspace schema (`workspace_<orgId>`). If either is missing
 * the DDL tests are skipped gracefully; only the 403 guard test runs.
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
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
} from 'test-helper';

describe('TooljetDbController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let adminOrgId: string;
    let tooljetDbAvailable: boolean;

    /** Try to ensure the workspace schema exists in the tooljetDb connection. */
    async function ensureWorkspaceSchema(orgId: string): Promise<boolean> {
      const tjds = getTooljetDbDataSource();
      if (!tjds) return false;
      try {
        await tjds.query(`CREATE SCHEMA IF NOT EXISTS "workspace_${orgId}"`);
        return true;
      } catch {
        return false;
      }
    }

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      adminOrgId = user.defaultOrganizationId;

      // The relation resolver pins the priority-1 environment for every DDL call - without a
      // seeded environment row, create_table 500s before it ever reaches the tooljetDb query.
      await ensureAppEnvironments(app, adminOrgId);

      // Ensure the tooljetDb workspace schema exists for DDL tests
      if (tooljetDbAvailable) {
        const schemaReady = await ensureWorkspaceSchema(adminOrgId);
        if (!schemaReady) tooljetDbAvailable = false;
      }

      const auth = await login(app);
      adminCookie = auth.tokenCookie;
    });

    afterEach(async () => {
      await logout(app, adminCookie, adminOrgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    // ---------------------------------------------------------------------------
    // Helper: build a minimal create-table payload matching CreatePostgrestTableDto
    // ---------------------------------------------------------------------------
    function buildCreateTablePayload(tableName: string) {
      return {
        table_name: tableName,
        columns: [
          {
            column_name: 'id',
            data_type: 'integer',
            constraints_type: {
              is_not_null: true,
              is_primary_key: true,
              is_unique: true,
            },
          },
          {
            column_name: 'name',
            data_type: 'character varying',
            constraints_type: {
              is_not_null: false,
              is_primary_key: false,
              is_unique: false,
            },
          },
        ],
        foreign_keys: [],
      };
    }

    // ---------------------------------------------------------------------------
    // Admin DDL tests | skipped when tooljetDb connection is unavailable
    // ---------------------------------------------------------------------------
    describe('Admin table DDL operations | create, list, delete tables', () => {
      it('admin can create a table', async function () {
        if (!tooljetDbAvailable) return;

        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('test_create_tbl'));

        expect([200, 201]).toContain(res.statusCode);
      });

      it('admin can list tables', async function () {
        if (!tooljetDbAvailable) return;

        // Create a table first so the list is non-empty
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('test_list_tbl'));

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/tables`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('result');
      });

      it('admin can delete a table', async function () {
        if (!tooljetDbAvailable) return;

        // Create then delete
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('test_drop_tbl'));

        const res = await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/test_drop_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(200);
      });
    });

    // ---------------------------------------------------------------------------
    // Column and table DDL round trip | pins editTable/addColumn/editColumn/dropColumn
    // naming through the resolver - each op below only succeeds if the handler resolved
    // the physical table it just renamed/altered, not a stale internal_table_id.
    // ---------------------------------------------------------------------------
    describe('Table and column DDL round trip | edit_table, add_column, edit_column, drop_column', () => {
      it('admin can rename a table, add a column, rename that column, then drop a different column', async function () {
        if (!tooljetDbAvailable) return;

        // is_unique: false here matches the physical column: prepareColumnListForCreateTable
        // ignores is_unique when is_primary_key is true, so the actual column was never built
        // with a standalone UNIQUE constraint for changeColumns to diff against.
        const idColumn = {
          column_name: 'id',
          data_type: 'integer',
          constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
        };

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('round_trip_tbl'));

        // edit_table: rename the table. The primary key column is carried through unchanged -
        // editTable requires at least one updated primary key column or it rejects the request.
        const renameRes = await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${adminOrgId}/table/round_trip_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'round_trip_tbl',
            new_table_name: 'round_trip_tbl_renamed',
            columns: [{ old_column: idColumn, new_column: idColumn }],
          });

        expect(renameRes.statusCode).toBe(200);

        // add_column
        const addColumnRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/round_trip_tbl_renamed/column`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            column: {
              column_name: 'extra',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
            foreign_keys: [],
          });

        expect([200, 201]).toContain(addColumnRes.statusCode);

        // edit_column: rename the column just added
        const editColumnRes = await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${adminOrgId}/table/round_trip_tbl_renamed/column`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            column: {
              column_name: 'extra',
              new_column_name: 'extra_renamed',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
          });

        expect(editColumnRes.statusCode).toBe(200);

        // drop_column: remove the original non-key column ('name', from buildCreateTablePayload)
        const dropColumnRes = await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/round_trip_tbl_renamed/column/name`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(dropColumnRes.statusCode).toBe(200);

        const viewRes = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/round_trip_tbl_renamed`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(viewRes.statusCode).toBe(200);
        const columnNames = viewRes.body.result.columns.map((column) => column.column_name);
        expect(columnNames).toEqual(expect.arrayContaining(['id', 'extra_renamed']));
        expect(columnNames).not.toContain('name');
        expect(columnNames).not.toContain('extra');
      });
    });

    // ---------------------------------------------------------------------------
    // view_table | this is the committed form of the 1e evidence: the pk/uk subqueries
    // are now scoped to (schema, relation id) instead of scanning every constraint in the
    // database, and this pins that the scoping did not change which flags come back.
    // ---------------------------------------------------------------------------
    describe('view_table | primary key and unique constraint reporting', () => {
      it('reports is_primary_key and is_unique correctly for a table with both', async function () {
        if (!tooljetDbAvailable) return;

        // A second table in the same schema with a same-named column ('email') that is NOT
        // unique - without the pushed-down TABLE_NAME predicate (or if it were ever mistargeted
        // at the wrong relation), the join could pick up this row instead of pk_uk_tbl's own.
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'pk_uk_decoy_tbl',
            columns: [
              {
                column_name: 'id',
                data_type: 'integer',
                constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
              },
              {
                column_name: 'email',
                data_type: 'character varying',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
            ],
            foreign_keys: [],
          });

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'pk_uk_tbl',
            columns: [
              {
                column_name: 'id',
                data_type: 'integer',
                constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
              },
              {
                column_name: 'email',
                data_type: 'character varying',
                constraints_type: { is_not_null: true, is_primary_key: false, is_unique: true },
              },
              {
                column_name: 'name',
                data_type: 'character varying',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
            ],
            foreign_keys: [],
          });

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/pk_uk_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(res.statusCode).toBe(200);
        const byName = Object.fromEntries(res.body.result.columns.map((column) => [column.column_name, column]));

        // is_unique here reflects a standalone UNIQUE constraint, not "no duplicates possible" -
        // a PRIMARY KEY constraint doesn't register as one, so the primary key column is false.
        expect(byName.id).toMatchObject({
          constraints_type: expect.objectContaining({ is_primary_key: true, is_unique: false }),
        });
        expect(byName.email).toMatchObject({
          constraints_type: expect.objectContaining({ is_primary_key: false, is_unique: true }),
        });
        expect(byName.name).toMatchObject({
          constraints_type: expect.objectContaining({ is_primary_key: false, is_unique: false }),
        });
      });
    });

    // ---------------------------------------------------------------------------
    // Foreign key DDL round trip | create, update, delete a foreign key between two tables -
    // pins that createForeignKey/updateForeignKey/deleteForeignKey resolve both the owning table
    // and the referenced table to physical names, and that the constraint they build really lands
    // in Postgres and really goes away, not just that the request returned 200.
    // ---------------------------------------------------------------------------
    describe('Foreign key DDL round trip | create_foreign_key, update_foreign_key, delete_foreign_key', () => {
      it('creates, updates, then deletes a foreign key between two tables', async function () {
        if (!tooljetDbAvailable) return;

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('fk_parent_tbl'));

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'fk_child_tbl',
            columns: [
              {
                column_name: 'id',
                data_type: 'integer',
                constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
              },
              {
                column_name: 'parent_id',
                data_type: 'integer',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
            ],
            foreign_keys: [],
          });

        const createRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_child_tbl/foreignkey`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'fk_parent_tbl',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          });

        expect([200, 201]).toContain(createRes.statusCode);

        const afterCreate = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_child_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(afterCreate.statusCode).toBe(200);
        expect(afterCreate.body.result.foreign_keys).toHaveLength(1);
        expect(afterCreate.body.result.foreign_keys[0]).toMatchObject({
          referenced_table_name: 'fk_parent_tbl',
          constraint_name: expect.any(String),
          column_names: ['parent_id'],
          referenced_column_names: ['id'],
          on_delete: 'CASCADE',
        });
        const foreignKeyId = afterCreate.body.result.foreign_keys[0].constraint_name;

        const updateRes = await request
          .agent(app.getHttpServer())
          .put(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_child_tbl/foreignkey`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            foreign_key_id: foreignKeyId,
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'fk_parent_tbl',
                referenced_column_names: ['id'],
                on_delete: 'SET NULL',
                on_update: 'NO ACTION',
              },
            ],
          });

        expect(updateRes.statusCode).toBe(200);

        const afterUpdate = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_child_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(afterUpdate.statusCode).toBe(200);
        expect(afterUpdate.body.result.foreign_keys).toHaveLength(1);
        expect(afterUpdate.body.result.foreign_keys[0]).toMatchObject({
          referenced_table_name: 'fk_parent_tbl',
          on_delete: 'SET NULL',
        });
        const updatedForeignKeyId = afterUpdate.body.result.foreign_keys[0].constraint_name;

        const deleteRes = await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_child_tbl/foreignkey/${updatedForeignKeyId}`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(deleteRes.statusCode).toBe(200);

        const afterDelete = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_child_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(afterDelete.statusCode).toBe(200);
        expect(afterDelete.body.result.foreign_keys).toHaveLength(0);
      });
    });

    // ---------------------------------------------------------------------------
    // End-user denial | this test does NOT require the tooljetDb connection
    // because the guard rejects before the service layer touches TJDB.
    // ---------------------------------------------------------------------------
    describe('End-user access denial | role-based guard', () => {
      it('end-user is denied table creation (403)', async () => {
        // Create an end-user (no admin group)
        const { user: endUser } = await createUser(app, {
          email: 'enduser@tooljet.io',
          firstName: 'End',
          lastName: 'User',
          groups: ['end-user'],
        });

        const { tokenCookie: endUserCookie } = await login(app, 'enduser@tooljet.io', 'password');

        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${endUser.defaultOrganizationId}/table`)
          .set('Cookie', endUserCookie)
          .set('tj-workspace-id', endUser.defaultOrganizationId)
          .send(buildCreateTablePayload('forbidden_tbl'));

        expect(res.statusCode).toBe(403);

        await logout(app, endUserCookie, endUser.defaultOrganizationId);
      });
    });
  });
});
