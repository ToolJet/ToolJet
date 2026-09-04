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
import { IsNull } from 'typeorm';
import {
  createUser,
  initTestApp,
  login,
  logout,
  getTooljetDbDataSource,
  getDefaultDataSource,
  closeTestApp,
  ensureAppEnvironments,
  createApplication,
  createApplicationVersion,
  saveEntity,
  updateEntity,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { App } from '@entities/app.entity';
import { Organization } from '@entities/organization.entity';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';
import { v4 as uuidv4 } from 'uuid';

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

    // `createUser` seeds Organization/User rows directly, bypassing SetupOrganizationsUtilService
    // - the real onboarding path that calls createTooljetDbTenantSchemaAndRole. Task B0's ownership
    // transfer needs the tenant role to actually exist, so tests exercising it provision the role
    // themselves, same workaround shape as ensureWorkspaceSchema above.
    async function ensureTenantRole(orgId: string): Promise<boolean> {
      const tjds = getTooljetDbDataSource();
      if (!tjds) return false;
      try {
        const [existing] = await tjds.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [`user_${orgId}`]);
        if (!existing) await tjds.query(`CREATE ROLE "user_${orgId}"`);
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

      // Ensure the tenant role exists - Task B0's ownership transfer needs it to be a real role.
      if (tooljetDbAvailable) {
        const roleReady = await ensureTenantRole(adminOrgId);
        if (!roleReady) tooljetDbAvailable = false;
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
        expect(tooljetDbAvailable).toBe(true);

        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('test_create_tbl'));

        expect([200, 201]).toContain(res.statusCode);
      });

      // create_table mints an independent relation id, so the physical table name is NOT the
      // logical table id. Rows written by the relation backfill migration still have the two equal,
      // so this pins only that newly created tables diverge.
      it('creates the relation with an id independent of the logical table id, and builds the physical table under it', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('diverged_id_tbl'));

        const manager = getDefaultDataSource().manager;
        const internalTable = await manager.findOne(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'diverged_id_tbl' },
        });
        expect(internalTable).toBeTruthy();

        const relations = await manager.find(InternalTableRelation, {
          where: { internalTableId: internalTable.id },
        });
        expect(relations).toHaveLength(1);
        expect(relations[0].id).not.toBe(internalTable.id);

        // The physical table exists under the relation id, and not under the logical id.
        const tableNames = await getTooljetDbDataSource().query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
          [`workspace_${adminOrgId}`]
        );
        const names = tableNames.map((row) => row.table_name);
        expect(names).toContain(relations[0].id);
        expect(names).not.toContain(internalTable.id);
      });

      // Table B0: raw SQL migration steps run as the tenant role, which needs ownership (not just
      // grants) to run DDL - Postgres has no GRANT ALTER TABLE. create_table must transfer
      // ownership at creation time.
      it('transfers ownership of a newly created table to the workspace tenant role', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const createRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('ownership_tbl'));
        expect([200, 201]).toContain(createRes.statusCode);

        const manager = getDefaultDataSource().manager;
        const internalTable = await manager.findOne(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'ownership_tbl' },
        });
        const relations = await manager.find(InternalTableRelation, {
          where: { internalTableId: internalTable.id },
        });

        const [owner] = await getTooljetDbDataSource().query(
          `SELECT tableowner FROM pg_tables WHERE schemaname = $1 AND tablename = $2`,
          [`workspace_${adminOrgId}`, relations[0].id]
        );
        expect(owner.tableowner).toBe(`user_${adminOrgId}`);
      });

      it('admin can list tables', async function () {
        expect(tooljetDbAvailable).toBe(true);

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
        expect(tooljetDbAvailable).toBe(true);

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

      it('drop is soft: the table disappears from view_tables and the resolver, its name is free for reuse, and the internal_tables row survives with deleted_at set', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('soft_delete_tbl'));

        const manager = getDefaultDataSource().manager;
        const originalTable = await manager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'soft_delete_tbl' },
        });

        const dropRes = await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/soft_delete_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        expect(dropRes.statusCode).toBe(200);

        // Row survives, soft-deleted rather than removed.
        const softDeletedTable = await manager.findOne(InternalTable, {
          where: { id: originalTable.id },
          withDeleted: true,
        });
        expect(softDeletedTable).toBeTruthy();
        expect(softDeletedTable.deletedAt).toBeTruthy();

        // Gone from the table list.
        const listRes = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/tables`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        const listedNames = listRes.body.result.map((table) => table.table_name);
        expect(listedNames).not.toContain('soft_delete_tbl');

        // Gone from the resolver: the dropped name no longer names anything.
        const viewRes = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/soft_delete_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        expect(viewRes.statusCode).toBe(404);

        // The name is free again - a new table can take it, minting a distinct logical row.
        const recreateRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('soft_delete_tbl'));
        expect([200, 201]).toContain(recreateRes.statusCode);

        const recreatedTable = await manager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'soft_delete_tbl' },
        });
        expect(recreatedTable.id).not.toBe(originalTable.id);
      });
    });

    // ---------------------------------------------------------------------------
    // Column and table DDL round trip | pins editTable/addColumn/editColumn/dropColumn
    // naming through the resolver - each op below only succeeds if the handler resolved
    // the physical table it just renamed/altered, not a stale internal_table_id.
    // ---------------------------------------------------------------------------
    describe('Table and column DDL round trip | edit_table, add_column, edit_column, drop_column', () => {
      it('admin can rename a table, add a column, rename that column, then drop a different column', async function () {
        expect(tooljetDbAvailable).toBe(true);

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
        expect(tooljetDbAvailable).toBe(true);

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
        expect(tooljetDbAvailable).toBe(true);

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

      it('view_table reports the referenced table by its logical internal_tables.id, not a relation id echoed back from the response', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('fk_r6_parent_tbl'));

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'fk_r6_child_tbl',
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
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_r6_child_tbl/foreignkey`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'fk_r6_parent_tbl',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          });
        expect([200, 201]).toContain(createRes.statusCode);

        // Read the referenced table's logical id independently from the database, not from
        // anything the view_table response itself echoes back - the whole trap of this test is
        // that a relation id substituted for the logical id would still pass a self-comparison.
        const parentTable = await getDefaultDataSource().manager.findOne(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'fk_r6_parent_tbl' },
        });

        const viewRes = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/fk_r6_child_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);

        expect(viewRes.statusCode).toBe(200);
        expect(viewRes.body.result.foreign_keys).toHaveLength(1);
        expect(viewRes.body.result.foreign_keys[0]).toMatchObject({
          referenced_table_id: parentTable.id,
          referenced_table_name: 'fk_r6_parent_tbl',
          constraint_name: expect.any(String),
          column_names: ['parent_id'],
          referenced_column_names: ['id'],
          on_delete: 'CASCADE',
        });
      });
    });

    // ---------------------------------------------------------------------------
    // Bulk upload | pins bulkUploadCsv/bulkUpsertRows naming the INSERT's target by relation id,
    // not the logical internal_table id. The relation id is moved off the logical id explicitly
    // rather than relying on create_table to have minted an independent one, so the assertion stays
    // non-vacuous however the fixture was built: were the two equal, it would pass whether or not
    // the resolver was ever consulted.
    // ---------------------------------------------------------------------------
    describe('Bulk upload | POST /table/:tableName/bulk-upload', () => {
      it('inserts CSV rows into the table named by the relation id and advances its serial sequence', async function () {
        expect(tooljetDbAvailable).toBe(true);

        const tableName = 'bulk_upload_tbl';
        const createRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: tableName,
            columns: [
              {
                column_name: 'id',
                data_type: 'serial',
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
        expect([200, 201]).toContain(createRes.statusCode);

        const appManager = getDefaultDataSource().manager;
        const tjDbManager = getTooljetDbDataSource();
        const tenantSchema = `workspace_${adminOrgId}`;

        const internalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName },
        });
        const originalRelation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: internalTable.id },
        });

        // Move the relation id off the logical id, and physically rename the table to match - this
        // is what keeps the "physical name is always the relation id" invariant true, and is the
        // only way a real INSERT can distinguish resolver-consulted code from code still using the
        // logical id: pre-fix code targets the (now renamed-away) old id and errors; post-fix code
        // targets the new id and succeeds.
        // The relation id gets reassigned below; migration bookkeeping keys off the pre-swap id via
        // an FK, so clear it first rather than fighting that FK - this test's concern is bulk_upload's
        // physical-name resolution, not the migration chain create_table just recorded.
        await appManager.delete(InternalTableMigrationApplication, { relationId: originalRelation.id });
        await appManager.delete(InternalTableMigration, { internalTableId: internalTable.id });

        const newRelationId = uuidv4();
        await tjDbManager.query(`ALTER TABLE "${tenantSchema}"."${originalRelation.id}" RENAME TO "${newRelationId}"`);
        await appManager.update(InternalTableRelation, { internalTableId: internalTable.id }, { id: newRelationId });

        try {
          // The 'id' header must be present (even blank) - bulkUploadCsv only recognizes a row's
          // primary key value as "let Postgres auto-generate this" when the column is present with
          // an empty value; a column absent from the CSV entirely isn't treated as a primary key at
          // all, and every row then collides as a false "duplicate primary key".
          const csvBuffer = Buffer.from('id,name\n,Alice\n,Bob\n');
          const uploadRes = await request
            .agent(app.getHttpServer())
            .post(`/api/tooljet-db/organizations/${adminOrgId}/table/${tableName}/bulk-upload`)
            .set('Cookie', adminCookie)
            .set('tj-workspace-id', adminOrgId)
            .attach('file', csvBuffer, 'rows.csv');

          expect(uploadRes.statusCode).toBe(201);
          expect(uploadRes.body.result).toMatchObject({ processed_rows: 2 });

          const rows = await tjDbManager.query(`SELECT * FROM "${tenantSchema}"."${newRelationId}" ORDER BY id`);
          expect(rows).toHaveLength(2);
          expect(rows.map((row) => row.name)).toEqual(['Alice', 'Bob']);
          expect(rows.map((row) => row.id)).toEqual([1, 2]);

          const [{ seq: seqName }] = await tjDbManager.query(
            `SELECT pg_get_serial_sequence('"${tenantSchema}"."${newRelationId}"', 'id') as seq`
          );
          const [{ last_value: sequenceValue }] = await tjDbManager.query(`SELECT last_value FROM ${seqName}`);
          expect(Number(sequenceValue)).toBe(2);
        } finally {
          // The rename ran on the tooljetDb data source, outside the app-DB suite transaction that
          // rolls the InternalTable/relation rows back - without this the physical table (now named
          // by newRelationId) would leak in the tenant schema on every run.
          await tjDbManager.query(`DROP TABLE IF EXISTS "${tenantSchema}"."${newRelationId}"`);
        }
      });
    });

    // ---------------------------------------------------------------------------
    // Migration recording | perform() wires TooljetDbMigrationRecorderService's
    // record/confirm/discard/adjudicatePending around every structured DDL op.
    // ---------------------------------------------------------------------------
    describe('Migration recording | perform() wiring', () => {
      /**
       * Both column invariants from the recording design: the relation's column_names map must
       * name exactly the table's physical columns, and every uuid it holds must have a matching
       * entry in configurations. Works after drop_table too - the relation survives (it's the
       * migration chain's anchor) with both sides cleared to empty.
       */
      async function assertColumnInvariants(tableName: string) {
        const appManager = getDefaultDataSource().manager;
        const tjDbManager = getTooljetDbDataSource();
        const tenantSchema = `workspace_${adminOrgId}`;

        const internalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName },
          withDeleted: true,
        });
        const relation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: internalTable.id },
        });
        const cols = relation.configurations?.columns ?? { column_names: {}, configurations: {} };

        const physicalColumns = await tjDbManager.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
          [tenantSchema, relation.id]
        );
        const physicalColumnNames = physicalColumns.map((row) => row.column_name).sort();

        expect(Object.keys(cols.column_names).sort()).toEqual(physicalColumnNames);
        expect(Object.values(cols.column_names).sort()).toEqual(Object.keys(cols.configurations).sort());
      }

      it('records a migration and an applied row for every one of the nine structured ops, with column invariants holding after each', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('mig_parent_tbl'));
        await assertColumnInvariants('mig_parent_tbl');

        const idColumn = {
          column_name: 'id',
          data_type: 'integer',
          constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
        };

        // create_table
        const createRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'mig_child_tbl',
            columns: [
              idColumn,
              {
                column_name: 'name',
                data_type: 'character varying',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
              {
                column_name: 'parent_id',
                data_type: 'integer',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
            ],
            foreign_keys: [],
          });
        expect([200, 201]).toContain(createRes.statusCode);
        await assertColumnInvariants('mig_child_tbl');

        // edit_table
        const renameRes = await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'mig_child_tbl',
            new_table_name: 'mig_child_tbl_renamed',
            columns: [{ old_column: idColumn, new_column: idColumn }],
          });
        expect(renameRes.statusCode).toBe(200);
        await assertColumnInvariants('mig_child_tbl_renamed');

        // add_column
        const addColRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed/column`)
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
        expect([200, 201]).toContain(addColRes.statusCode);
        await assertColumnInvariants('mig_child_tbl_renamed');

        // edit_column
        const editColRes = await request
          .agent(app.getHttpServer())
          .patch(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed/column`)
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
        expect(editColRes.statusCode).toBe(200);
        await assertColumnInvariants('mig_child_tbl_renamed');

        // drop_column
        const dropColRes = await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed/column/name`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        expect(dropColRes.statusCode).toBe(200);
        await assertColumnInvariants('mig_child_tbl_renamed');

        // create_foreign_key
        const createFkRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed/foreignkey`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'mig_parent_tbl',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          });
        expect([200, 201]).toContain(createFkRes.statusCode);
        await assertColumnInvariants('mig_child_tbl_renamed');

        const afterCreateFk = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        const foreignKeyId = afterCreateFk.body.result.foreign_keys[0].constraint_name;

        // update_foreign_key
        const updateFkRes = await request
          .agent(app.getHttpServer())
          .put(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed/foreignkey`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            foreign_key_id: foreignKeyId,
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'mig_parent_tbl',
                referenced_column_names: ['id'],
                on_delete: 'SET NULL',
                on_update: 'NO ACTION',
              },
            ],
          });
        expect(updateFkRes.statusCode).toBe(200);
        await assertColumnInvariants('mig_child_tbl_renamed');

        const afterUpdateFk = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        const updatedForeignKeyId = afterUpdateFk.body.result.foreign_keys[0].constraint_name;

        // delete_foreign_key
        const deleteFkRes = await request
          .agent(app.getHttpServer())
          .delete(
            `/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed/foreignkey/${updatedForeignKeyId}`
          )
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        expect(deleteFkRes.statusCode).toBe(200);
        await assertColumnInvariants('mig_child_tbl_renamed');

        // drop_table
        const dropTableRes = await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/mig_child_tbl_renamed`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        expect(dropTableRes.statusCode).toBe(200);
        await assertColumnInvariants('mig_child_tbl_renamed');

        // All nine structured ops ran against mig_child_tbl(_renamed): create_table, edit_table,
        // add_column, edit_column, drop_column, create_foreign_key, update_foreign_key,
        // delete_foreign_key, drop_table.
        const appManager = getDefaultDataSource().manager;
        const internalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'mig_child_tbl_renamed' },
          withDeleted: true,
        });
        const migrations = await appManager.find(InternalTableMigration, {
          where: { internalTableId: internalTable.id },
          order: { sequence: 'ASC' },
        });
        expect(migrations).toHaveLength(9);

        const sequences = migrations.map((migration) => Number(migration.sequence));
        for (let i = 1; i < sequences.length; i++) {
          expect(sequences[i]).toBeGreaterThan(sequences[i - 1]);
        }

        const migrationIds = migrations.map((migration) => migration.id);
        const applications = await appManager
          .createQueryBuilder(InternalTableMigrationApplication, 'application')
          .where('application.migration_id IN (:...migrationIds)', { migrationIds })
          .getMany();
        expect(applications).toHaveLength(9);
        expect(applications.every((application) => application.appliedAt !== null)).toBe(true);
        expect(migrations.every((migration) => migration.resultingSchema !== null)).toBe(true);
      });

      // The three confirm-only ops (drop_table/drop_column/delete_foreign_key) took only
      // @Param()s, so migration_name could never reach them - their routes now accept a body too.
      it('records the given migration_name for drop_column, delete_foreign_key and drop_table, and falls back to the default name when omitted', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'named_deletes_tbl',
            columns: [
              {
                column_name: 'id',
                data_type: 'integer',
                constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
              },
              {
                column_name: 'note',
                data_type: 'character varying',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
              {
                column_name: 'parent_id',
                data_type: 'integer',
                constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
              },
            ],
            foreign_keys: [],
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('named_deletes_parent_tbl'))
          .expect((res) => expect([200, 201]).toContain(res.statusCode));
        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/named_deletes_tbl/foreignkey`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'named_deletes_parent_tbl',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          })
          .expect((res) => expect([200, 201]).toContain(res.statusCode));

        const appManager = getDefaultDataSource().manager;
        const internalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'named_deletes_tbl' },
          withDeleted: true,
        });

        const viewRes = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/named_deletes_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        const foreignKeyId = viewRes.body.result.foreign_keys[0].constraint_name;

        // drop_column, given a name.
        await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/named_deletes_tbl/column/note`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({ migration_name: 'Drop the note column' })
          .expect((res) => expect(res.statusCode).toBe(200));

        // delete_foreign_key, name omitted - falls back to defaultMigrationName.
        await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/named_deletes_tbl/foreignkey/${foreignKeyId}`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .expect((res) => expect(res.statusCode).toBe(200));

        // drop_table, given a name.
        await request
          .agent(app.getHttpServer())
          .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/named_deletes_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({ migration_name: 'Drop named_deletes_tbl' })
          .expect((res) => expect(res.statusCode).toBe(200));

        const migrations = await appManager.find(InternalTableMigration, {
          where: { internalTableId: internalTable.id },
          order: { sequence: 'ASC' },
        });
        const byAction = Object.fromEntries(migrations.map((m) => [(m.payload as any).action, m]));
        expect(byAction['drop_column'].name).toBe('Drop the note column');
        expect(byAction['delete_foreign_key'].name).toBe('Remove foreign key on "named_deletes_tbl"');
        expect(byAction['drop_table'].name).toBe('Drop named_deletes_tbl');
      });

      it('a create_table request carrying foreign keys records one migration, and a follow-up op on the same table gets a distinct, larger sequence', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('seq_parent_tbl'));

        const createRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: 'seq_child_tbl',
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
            foreign_keys: [
              {
                column_names: ['parent_id'],
                referenced_table_name: 'seq_parent_tbl',
                referenced_column_names: ['id'],
                on_delete: 'CASCADE',
                on_update: 'NO ACTION',
              },
            ],
          });
        expect([200, 201]).toContain(createRes.statusCode);

        const addColRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/seq_child_tbl/column`)
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
        expect([200, 201]).toContain(addColRes.statusCode);

        const appManager = getDefaultDataSource().manager;
        const internalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'seq_child_tbl' },
        });
        const migrations = await appManager.find(InternalTableMigration, {
          where: { internalTableId: internalTable.id },
          order: { sequence: 'ASC' },
        });

        // One migration for the FK-carrying create_table request - the foreign key is embedded in
        // the same payload and applied as part of the same CREATE TABLE, not a second
        // create_foreign_key call - plus one for the follow-up add_column.
        expect(migrations).toHaveLength(2);
        expect(migrations[0].payload.action).toBe('create_table');
        expect(migrations[0].payload.request.foreign_keys).toHaveLength(1);
        expect(migrations[1].payload.action).toBe('add_column');
        expect(Number(migrations[1].sequence)).toBeGreaterThan(Number(migrations[0].sequence));
      });

      it('a failed DDL leaves no migration and no application row, and surfaces the original Postgres error', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('fail_ddl_tbl'));

        const appManager = getDefaultDataSource().manager;
        const internalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'fail_ddl_tbl' },
        });
        const migrationsBefore = await appManager.count(InternalTableMigration, {
          where: { internalTableId: internalTable.id },
        });

        // 'id' already exists - add_column's own DDL fails with Postgres' duplicate-column error.
        const failRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/fail_ddl_tbl/column`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            column: {
              column_name: 'id',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
            foreign_keys: [],
          });

        expect(failRes.statusCode).toBeGreaterThanOrEqual(400);
        expect(JSON.stringify(failRes.body)).toMatch(/already exists/i);

        const migrationsAfter = await appManager.count(InternalTableMigration, {
          where: { internalTableId: internalTable.id },
        });
        expect(migrationsAfter).toBe(migrationsBefore);

        const relation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: internalTable.id },
        });
        const pendingApplications = await appManager.count(InternalTableMigrationApplication, {
          where: { relationId: relation.id, appliedAt: IsNull() },
        });
        expect(pendingApplications).toBe(0);
      });

      it('adjudicates a pending migration on next access: confirms one whose DDL happened, deletes one whose DDL did not', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('adjudicate_tbl'));

        const addColRes = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table/adjudicate_tbl/column`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            column: {
              column_name: 'confirmed_col',
              data_type: 'character varying',
              constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
            },
            foreign_keys: [],
          });
        expect([200, 201]).toContain(addColRes.statusCode);

        const appManager = getDefaultDataSource().manager;
        const internalTable = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'adjudicate_tbl' },
        });
        const relation = await appManager.findOneOrFail(InternalTableRelation, {
          where: { internalTableId: internalTable.id },
        });

        const confirmedMigration = await appManager.findOneOrFail(InternalTableMigration, {
          where: { internalTableId: internalTable.id },
          order: { sequence: 'DESC' },
        });

        // Write the pending state directly - simulates a crash between record() and confirm()
        // without actually crashing the process.
        await appManager.update(InternalTableMigration, { id: confirmedMigration.id }, { resultingSchema: null });
        await appManager.update(
          InternalTableMigrationApplication,
          { migrationId: confirmedMigration.id },
          { appliedAt: null }
        );

        // A migration whose DDL never happened: the column it claims to have added does not exist.
        const ghostMigration = appManager.create(InternalTableMigration, {
          internalTableId: internalTable.id,
          sequence: String(Number(confirmedMigration.sequence) + 1),
          branchId: confirmedMigration.branchId,
          kind: 'structured',
          payload: {
            action: 'add_column',
            request: { table_name: 'adjudicate_tbl', column: { column_name: 'ghost_col_never_created' } },
          },
          resultingSchema: null,
        });
        await appManager.save(ghostMigration);
        await appManager.save(
          appManager.create(InternalTableMigrationApplication, {
            migrationId: ghostMigration.id,
            relationId: relation.id,
            appliedAt: null,
          })
        );

        // Back-date both past adjudicatePending's grace window, or the GET below would leave them
        // pending on the assumption that whichever request just recorded them is still running.
        await appManager.query(
          `UPDATE internal_table_migrations SET created_at = now() - interval '1 minute' WHERE id = ANY($1)`,
          [[confirmedMigration.id, ghostMigration.id]]
        );

        // view_table calls adjudicatePending right before it reads the relation's shape - the
        // GET here is what resolves both rows.
        const viewRes = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/adjudicate_tbl`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        expect(viewRes.statusCode).toBe(200);

        const reconfirmed = await appManager.findOneOrFail(InternalTableMigration, {
          where: { id: confirmedMigration.id },
        });
        expect(reconfirmed.resultingSchema).not.toBeNull();
        const reconfirmedApplication = await appManager.findOneOrFail(InternalTableMigrationApplication, {
          where: { migrationId: confirmedMigration.id },
        });
        expect(reconfirmedApplication.appliedAt).not.toBeNull();

        const ghostStillThere = await appManager.findOne(InternalTableMigration, {
          where: { id: ghostMigration.id },
        });
        expect(ghostStillThere).toBeNull();
      });
    });

    describe('GET .../table/:tableId/dependents', () => {
      it('counts a table_id reference and a join-condition-only reference as distinct apps, includes a workflow, excludes an old unreleased version, and dedupes multiple queries on one app', async function () {
        expect(tooljetDbAvailable).toBe(true);

        await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send(buildCreateTablePayload('deps_target_tbl'))
          .expect((res) => expect([200, 201]).toContain(res.statusCode));
        const appManager = getDefaultDataSource().manager;
        const table = await appManager.findOneOrFail(InternalTable, {
          where: { organizationId: adminOrgId, tableName: 'deps_target_tbl' },
        });

        const adminOrg = await appManager.findOneOrFail(Organization, { where: { id: adminOrgId } });
        const { user } = await createUser(app, {
          email: 'deps-fixture@tooljet.io',
          firstName: 'Deps',
          lastName: 'Fixture',
          groups: ['admin'],
          organization: adminOrg,
        });

        const ds = await saveEntity(DataSourceEntity, {
          name: 'tooljetdb',
          kind: 'tooljetdb',
          type: 'static',
          scope: 'global',
          organizationId: adminOrgId,
        } as any);

        // Direct reference: app.currentVersionId points at the version carrying the query.
        const directApp = await createApplication(app, { name: 'Direct-Ref-App', user, type: 'front-end' });
        const directVersion = await createApplicationVersion(app, directApp as any);
        await saveEntity(DataQuery, {
          name: 'getRows',
          options: { table_id: table.id, operation: 'list_rows' },
          dataSourceId: ds.id,
          appVersionId: directVersion.id,
        } as any);
        // A second query on the SAME app/version, also referencing the table - must not create a
        // second dependent entry.
        await saveEntity(DataQuery, {
          name: 'getMoreRows',
          options: { table_id: table.id, operation: 'list_rows' },
          dataSourceId: ds.id,
          appVersionId: directVersion.id,
        } as any);
        await updateEntity(App, directApp.id, { currentVersionId: directVersion.id });

        // Join-condition-only reference, on a workflow.
        const joinApp = await createApplication(app, { name: 'Join-Ref-Workflow', user, type: 'workflow' });
        const joinVersion = await createApplicationVersion(app, joinApp as any);
        await saveEntity(DataQuery, {
          name: 'joinQuery',
          options: {
            operation: 'join_tables',
            join_table: {
              joins: [
                {
                  conditions: {
                    conditionsList: [{ leftField: { table: table.id, name: 'id' }, rightField: { name: '1' } }],
                  },
                },
              ],
            },
          },
          dataSourceId: ds.id,
          appVersionId: joinVersion.id,
        } as any);
        await updateEntity(App, joinApp.id, { currentVersionId: joinVersion.id });

        // Old, unreleased, non-current version on a third app - a table_id reference here must not
        // count: it is neither the app's current version nor ever released.
        const staleApp = await createApplication(app, { name: 'Stale-Version-App', user, type: 'front-end' });
        const staleOldVersion = await createApplicationVersion(app, staleApp as any);
        await saveEntity(DataQuery, {
          name: 'staleQuery',
          options: { table_id: table.id, operation: 'list_rows' },
          dataSourceId: ds.id,
          appVersionId: staleOldVersion.id,
        } as any);
        const staleCurrentVersion = await createApplicationVersion(app, staleApp as any);
        await updateEntity(App, staleApp.id, { currentVersionId: staleCurrentVersion.id });

        const res = await request
          .agent(app.getHttpServer())
          .get(`/api/tooljet-db/organizations/${adminOrgId}/table/${table.id}/dependents`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId);
        expect(res.statusCode).toBe(200);

        const { count, dependents } = res.body.result;
        expect(count).toBe(2);
        const byId = Object.fromEntries(dependents.map((d: any) => [d.id, d]));
        expect(byId[directApp.id]).toMatchObject({ name: 'Direct-Ref-App', type: 'front-end' });
        expect(byId[directApp.id].queries).toHaveLength(2);
        expect(byId[joinApp.id]).toMatchObject({ name: 'Join-Ref-Workflow', type: 'workflow' });
        expect(byId[staleApp.id]).toBeUndefined();
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
