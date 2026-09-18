/**
 * Unified drop-table dependency check: `dropTable`'s blocker and the
 * `GET .../table/:tableId/dependents` soft-warning route now read the exact same thing -
 * `InternalTableRepository.findDependents` (app queries) and `.findForeignKeyDependents` (inbound
 * Postgres FKs from another TJDB table), both surfaced through
 * `TooljetDbEnvironmentAssignmentService.getDependents`. A table can no longer pass one check and
 * fail the other.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import {
  createUser,
  initTestApp,
  login,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
  createApplication,
  createApplicationVersion,
  saveEntity,
  updateEntity,
  TestUser,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { App } from '@entities/app.entity';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';

describe('TooljetDb drop_table dependents', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let adminUser: TestUser;
    let tjdbAvailable: boolean;

    const headers = () => ({ Cookie: adminCookie, 'tj-workspace-id': orgId });

    const idColumn = {
      column_name: 'id',
      data_type: 'integer',
      constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
    };

    async function createTable(tableName: string, columns: unknown[] = [idColumn]) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers())
        .send({ table_name: tableName, columns, foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));
    }

    async function addForeignKey(tableName: string, foreignKey: Record<string, unknown>) {
      return request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table/${tableName}/foreignkey`)
        .set(headers())
        .send({ foreign_keys: [foreignKey] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));
    }

    async function dropTable(tableName: string) {
      return request
        .agent(app.getHttpServer())
        .delete(`/api/tooljet-db/organizations/${orgId}/table/${tableName}`)
        .set(headers());
    }

    async function internalTableId(tableName: string): Promise<string> {
      const row = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName },
      });
      return row.id;
    }

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'drop-deps-admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      adminUser = user;

      await ensureAppEnvironments(app, orgId);

      if (tjdbAvailable) {
        try {
          const tenantSchema = `workspace_${orgId}`;
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "${tenantSchema}"`);
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tjdbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app, 'drop-deps-admin@tooljet.io'));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should block the drop when an app query references the table', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable('query_dep_tbl');
      const tableId = await internalTableId('query_dep_tbl');

      const ds = await saveEntity(DataSourceEntity, {
        name: 'tooljetdb',
        kind: 'tooljetdb',
        type: 'static',
        scope: 'global',
        organizationId: orgId,
      } as Partial<DataSourceEntity>);

      const queryApp = await createApplication(app, { name: 'Query-Dep-App', user: adminUser, type: 'front-end' });
      const version = await createApplicationVersion(app, queryApp as App & { organizationId: string });
      await saveEntity(DataQuery, {
        name: 'getRows',
        options: { table_id: tableId, operation: 'list_rows' },
        dataSourceId: ds.id,
        appVersionId: version.id,
      } as Partial<DataQuery>);
      await updateEntity(App, queryApp.id, { currentVersionId: version.id });

      const depsRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/dependents`)
        .set(headers());
      expect(depsRes.statusCode).toBe(200);
      expect(depsRes.body.result.count).toBe(1);
      expect(depsRes.body.result.dependents[0].name).toBe('Query-Dep-App');
      expect(depsRes.body.result.foreignKeyTables).toEqual([]);

      const res = await dropTable('query_dep_tbl');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/app quer/i);

      // Never actually dropped - still resolvable.
      const stillThere = await getDefaultDataSource().manager.findOne(InternalTable, {
        where: { organizationId: orgId, tableName: 'query_dep_tbl' },
      });
      expect(stillThere).not.toBeNull();
    });

    it('should block the drop when another TJDB table holds a foreign key into it', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable('fk_parent_dep_tbl');
      await createTable('fk_child_dep_tbl', [
        idColumn,
        {
          column_name: 'parent_id',
          data_type: 'integer',
          constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
        },
      ]);
      await addForeignKey('fk_child_dep_tbl', {
        column_names: ['parent_id'],
        referenced_table_name: 'fk_parent_dep_tbl',
        referenced_column_names: ['id'],
        on_delete: 'CASCADE',
        on_update: 'NO ACTION',
      });

      const tableId = await internalTableId('fk_parent_dep_tbl');
      const depsRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/dependents`)
        .set(headers());
      expect(depsRes.statusCode).toBe(200);
      expect(depsRes.body.result.count).toBe(0);
      expect(depsRes.body.result.foreignKeyTables).toEqual([expect.objectContaining({ name: 'fk_child_dep_tbl' })]);

      const res = await dropTable('fk_parent_dep_tbl');
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/foreign key/i);
      expect(res.body.message).toContain('fk_child_dep_tbl');

      const stillThere = await getDefaultDataSource().manager.findOne(InternalTable, {
        where: { organizationId: orgId, tableName: 'fk_parent_dep_tbl' },
      });
      expect(stillThere).not.toBeNull();
    });

    it('should allow the drop for a table whose only foreign key is self-referencing', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable('fk_self_ref_tbl', [
        idColumn,
        {
          column_name: 'parent_id',
          data_type: 'integer',
          constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
        },
      ]);
      await addForeignKey('fk_self_ref_tbl', {
        column_names: ['parent_id'],
        referenced_table_name: 'fk_self_ref_tbl',
        referenced_column_names: ['id'],
        on_delete: 'CASCADE',
        on_update: 'NO ACTION',
      });

      const tableId = await internalTableId('fk_self_ref_tbl');
      const depsRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/dependents`)
        .set(headers());
      expect(depsRes.statusCode).toBe(200);
      expect(depsRes.body.result.count).toBe(0);
      expect(depsRes.body.result.foreignKeyTables).toEqual([]);

      const res = await dropTable('fk_self_ref_tbl');
      expect(res.statusCode).toBe(200);

      const gone = await getDefaultDataSource().manager.findOne(InternalTable, {
        where: { organizationId: orgId, tableName: 'fk_self_ref_tbl' },
      });
      expect(gone).toBeNull();
    });

    it('should allow the drop for a table with no dependents', async () => {
      expect(tjdbAvailable).toBe(true);

      await createTable('no_deps_tbl');

      const tableId = await internalTableId('no_deps_tbl');
      const depsRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/${tableId}/dependents`)
        .set(headers());
      expect(depsRes.statusCode).toBe(200);
      expect(depsRes.body.result.count).toBe(0);
      expect(depsRes.body.result.foreignKeyTables).toEqual([]);

      const res = await dropTable('no_deps_tbl');
      expect(res.statusCode).toBe(200);

      const gone = await getDefaultDataSource().manager.findOne(InternalTable, {
        where: { organizationId: orgId, tableName: 'no_deps_tbl' },
      });
      expect(gone).toBeNull();
    });
  });
});
