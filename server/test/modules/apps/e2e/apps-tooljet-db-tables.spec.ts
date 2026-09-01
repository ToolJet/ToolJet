/**
 * findTooljetDbTables must not surface soft-deleted (drop_table'd) internal_tables rows —
 * an app whose saved query still references a dropped table would otherwise block that
 * app's promotion permanently (Task 8 gates promotion on every queried table existing).
 *
 * drop_table's own in-use guard (findQueriesLinkedToTable) only looks at each app's LATEST
 * version, so a table can still be dropped while an OLDER version's query keeps referencing
 * it — that's the exact case this test seeds: the reference lives on a stale version, so the
 * guard lets the drop through, and findTooljetDbTables (which joins across every version of
 * the app, not just the latest) must filter the now-dead reference out itself.
 *
 * NOTE: requires a separate tooljetDb connection + per-workspace schema, same as
 * tooljetdb-operations.spec.ts. Skipped gracefully if unavailable.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
// See apps-util-service-create.e2e-spec.ts: the test app boots with edition 'ee', so the
// DI container registers the EE subclass — import that class reference, not the CE base.
import { AppsUtilService } from '@ee/apps/util.service';
import {
  createUser,
  initTestApp,
  login,
  closeTestApp,
  ensureAppEnvironments,
  getTooljetDbDataSource,
  getDefaultDataSource,
  createApplication,
  createApplicationVersion,
  createDataSource,
  createDataQuery,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';

describe('AppsUtilService.findTooljetDbTables', () => {
  let app: INestApplication;
  let appsUtilService: AppsUtilService;
  let adminCookie: string[];
  let adminOrgId: string;
  let adminUser: Awaited<ReturnType<typeof createUser>>['user'];
  let tooljetDbAvailable: boolean;

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

  function buildCreateTablePayload(tableName: string) {
    return {
      table_name: tableName,
      columns: [
        {
          column_name: 'id',
          data_type: 'integer',
          constraints_type: { is_not_null: true, is_primary_key: true, is_unique: true },
        },
      ],
      foreign_keys: [],
    };
  }

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    appsUtilService = app.get(AppsUtilService);
    tooljetDbAvailable = !!getTooljetDbDataSource();

    const { user } = await createUser(app, {
      email: 'admin@tooljet.io',
      firstName: 'Admin',
      lastName: 'User',
      groups: ['admin', 'end-user'],
    });
    adminUser = user;
    adminOrgId = user.defaultOrganizationId;

    await ensureAppEnvironments(app, adminOrgId);

    if (tooljetDbAvailable) {
      const schemaReady = await ensureWorkspaceSchema(adminOrgId);
      if (!schemaReady) tooljetDbAvailable = false;
    }

    const auth = await login(app);
    adminCookie = auth.tokenCookie;
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  it('excludes a soft-deleted (dropped) table from the tables an app queries', async () => {
    expect(tooljetDbAvailable).toBe(true);

    await request
      .agent(app.getHttpServer())
      .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
      .set('Cookie', adminCookie)
      .set('tj-workspace-id', adminOrgId)
      .send(buildCreateTablePayload('surviving_tbl'));

    await request
      .agent(app.getHttpServer())
      .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
      .set('Cookie', adminCookie)
      .set('tj-workspace-id', adminOrgId)
      .send(buildCreateTablePayload('dropped_tbl'));

    const manager = getDefaultDataSource().manager;
    const survivingTable = await manager.findOneOrFail(InternalTable, {
      where: { organizationId: adminOrgId, tableName: 'surviving_tbl' },
    });
    const droppedTable = await manager.findOneOrFail(InternalTable, {
      where: { organizationId: adminOrgId, tableName: 'dropped_tbl' },
    });

    const application = await createApplication(app, { name: 'TjdbTablesApp', user: adminUser }, false);

    // Stale (non-latest) version: its query references dropped_tbl, but drop_table's guard
    // only inspects the latest version, so this reference is invisible to it.
    const staleVersion = await createApplicationVersion(app, application, { name: 'stale' });
    const staleDataSource = await createDataSource(app, {
      appVersion: staleVersion,
      kind: 'tooljetdb',
      name: 'tooljetdb_stale',
    });
    await createDataQuery(app, {
      dataSource: staleDataSource,
      appVersion: staleVersion,
      options: { table_id: droppedTable.id },
    });

    // Latest version: only references surviving_tbl, so drop_table's guard sees no reference
    // to dropped_tbl and allows the drop.
    const latestVersion = await createApplicationVersion(app, application, { name: 'latest' });
    const latestDataSource = await createDataSource(app, {
      appVersion: latestVersion,
      kind: 'tooljetdb',
      name: 'tooljetdb_latest',
    });
    await createDataQuery(app, {
      dataSource: latestDataSource,
      appVersion: latestVersion,
      options: { table_id: survivingTable.id },
    });

    // drop_table's "latest version" guard orders by created_at, which lands in the same
    // millisecond for both versions when seeded back-to-back in a fast test run — force a
    // deterministic order so the guard reliably treats latestVersion as latest.
    await manager.query(`UPDATE app_versions SET created_at = created_at - interval '1 minute' WHERE id = $1`, [
      staleVersion.id,
    ]);

    // drop_table soft-deletes: the internal_tables row survives with deleted_at set.
    const dropRes = await request
      .agent(app.getHttpServer())
      .delete(`/api/tooljet-db/organizations/${adminOrgId}/table/dropped_tbl`)
      .set('Cookie', adminCookie)
      .set('tj-workspace-id', adminOrgId);
    expect(dropRes.statusCode).toBe(200);

    const result = await appsUtilService.findTooljetDbTables(application.id);

    expect(result).toEqual([{ table_id: survivingTable.id }]);
  });
});
