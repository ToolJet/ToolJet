/**
 * TJDB table & row license-limit enforcement.
 *
 * Uses the "basic" test plan, whose Terms (server/ee/licensing/constants/PlanTerms.ts
 * BASIC_PLAN_TERMS — the real self-hosted "Free" plan) are the actual production values:
 * 10 tables, 500 rows. This exercises the real guard/service pipeline against those real
 * numbers rather than a synthetic mock, so a change to the plan's limits would be caught here.
 *
 * @group database
 */
import { HttpException, INestApplication } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import * as request from 'supertest';
import {
  resetDB,
  createUser,
  initTestApp,
  login,
  logout,
  getTooljetDbDataSource,
  getDefaultDataSource,
  closeTestApp,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbDataOperationsService } from '@modules/tooljet-db/services/tooljet-db-data-operations.service';
import { TooljetDbBulkUploadService } from '@modules/tooljet-db/services/tooljet-db-bulk-upload.service';
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';
import { setupTestTables } from '../../../tooljet-db-test.helper';

describe('TooljetDbController / TooljetDbDataOperationsService — license limits', () => {
describe('EE (plan: basic — 10 tables, 500 rows)', () => {
  let app: INestApplication;
  let appManager: EntityManager;
  let tjDbManager: EntityManager;
  let tableOperationsService: TooljetDbTableOperationsService;
  let dataOperationsService: TooljetDbDataOperationsService;
  let bulkUploadService: TooljetDbBulkUploadService;
  let postgrestProxyService: PostgrestProxyService;
  let adminCookie: string[];
  let organizationId: string;
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
        {
          column_name: 'name',
          data_type: 'character varying',
          constraints_type: { is_not_null: false, is_primary_key: false, is_unique: false },
        },
      ],
      foreign_keys: [],
    };
  }

  /** Fast bulk-seed: inserts `count` rows directly, bypassing PostgREST/the app. */
  async function seedRows(tableId: string, count: number) {
    if (count <= 0) return;
    const schema = `workspace_${organizationId}`;
    await tjDbManager.query(
      `INSERT INTO "${schema}"."${tableId}" (name, email) SELECT 'u'||g, 'u'||g||'@example.com' FROM generate_series(1, $1) g`,
      [count]
    );
  }

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'basic' }));
    tooljetDbAvailable = !!getTooljetDbDataSource();
    tableOperationsService = app.get(TooljetDbTableOperationsService);
    dataOperationsService = app.get(TooljetDbDataOperationsService);
    bulkUploadService = app.get(TooljetDbBulkUploadService);
    postgrestProxyService = app.get(PostgrestProxyService);
    appManager = getDefaultDataSource().manager;
    if (tooljetDbAvailable) tjDbManager = getTooljetDbDataSource().manager;
  });

  beforeEach(async () => {
    await resetDB();
    jest.restoreAllMocks();

    const { user } = await createUser(app, {
      email: 'admin@tooljet.io',
      firstName: 'Admin',
      lastName: 'User',
      groups: ['admin', 'end-user'],
    });
    organizationId = user.defaultOrganizationId;

    if (tooljetDbAvailable) {
      const schemaReady = await ensureWorkspaceSchema(organizationId);
      if (!schemaReady) tooljetDbAvailable = false;
    }

    const auth = await login(app);
    adminCookie = auth.tokenCookie;
  });

  afterEach(async () => {
    await logout(app, adminCookie, organizationId);
  });

  afterAll(async () => {
    await resetDB();
    await closeTestApp(app);
  }, 60_000);

  // ---------------------------------------------------------------------------
  // Table limit (10) — TableCountGuard on POST /organizations/:id/table
  // ---------------------------------------------------------------------------
  describe('Table limit', () => {
    it('allows creating up to 10 tables and blocks the 11th with 451', async () => {
      if (!tooljetDbAvailable) return;

      for (let i = 1; i <= 10; i++) {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${organizationId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', organizationId)
          .send(buildCreateTablePayload(`limit_tbl_${i}`));
        expect([200, 201]).toContain(res.statusCode);
      }

      const blocked = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', organizationId)
        .send(buildCreateTablePayload('limit_tbl_11'));

      expect(blocked.statusCode).toBe(451);

      const stillTen = await appManager.count(InternalTable, { where: { organizationId } });
      expect(stillTen).toBe(10);
    }, 30_000);
  });

  // ---------------------------------------------------------------------------
  // Row counting & the 500-row cap
  // ---------------------------------------------------------------------------
  describe('Row limit — counting and gating', () => {
    it('getRowsCount sums rows across every table in the workspace', async () => {
      if (!tooljetDbAvailable) return;

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });
      const ordersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'orders' },
      });
      const schema = `workspace_${organizationId}`;

      await seedRows(usersTable.id, 3);
      await tjDbManager.query(
        `INSERT INTO "${schema}"."${ordersTable.id}" (user_id, total) SELECT (g % 3) + 1, 9.99 FROM generate_series(1, 4) g`
      );

      expect(await tableOperationsService.getRowsCount(organizationId)).toBe(7);
    });

    it('getRemainingRowCapacity and isRowLimitReached track the 500-row cap', async () => {
      if (!tooljetDbAvailable) return;

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });

      expect(await tableOperationsService.getRemainingRowCapacity(organizationId)).toBe(500);
      expect(await tableOperationsService.isRowLimitReached(organizationId)).toBe(false);

      await seedRows(usersTable.id, 500);

      expect(await tableOperationsService.getRemainingRowCapacity(organizationId)).toBe(0);
      expect(await tableOperationsService.isRowLimitReached(organizationId)).toBe(true);
    }, 30_000);
  });

  // ---------------------------------------------------------------------------
  // createRow (app-query "Create row" operation)
  // ---------------------------------------------------------------------------
  describe('Row limit — createRow (app query execution)', () => {
    it('returns a soft failure and never calls PostgREST once the row limit is reached', async () => {
      if (!tooljetDbAvailable) return;

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });
      await seedRows(usersTable.id, 500);

      const performSpy = jest.spyOn(postgrestProxyService, 'perform');

      const result = await dataOperationsService.createRow(
        {
          id: 'query-1',
          table_id: usersTable.id,
          create_row: {
            0: { column: 'name', value: 'New Row' },
            1: { column: 'email', value: 'new-row@example.com' },
          },
        },
        { app: { organization_id: organizationId } }
      );

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toContain("You've reached your limit of rows in ToolJet database tables");
      expect(performSpy).not.toHaveBeenCalled();
    }, 30_000);

    it('proceeds to PostgREST when under the row limit', async () => {
      if (!tooljetDbAvailable) return;

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });

      const performSpy = jest
        .spyOn(postgrestProxyService, 'perform')
        .mockResolvedValueOnce([{ id: 1 }] as any);

      const result = await dataOperationsService.createRow(
        {
          id: 'query-1',
          table_id: usersTable.id,
          create_row: {
            0: { column: 'name', value: 'New Row' },
            1: { column: 'email', value: 'new-row@example.com' },
          },
        },
        { app: { organization_id: organizationId } }
      );

      expect(performSpy).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('ok');
    });
  });

  // ---------------------------------------------------------------------------
  // Bulk paths — must check "would this batch exceed the cap", not just
  // "are we already at/over it" (497 existing + a 5-row batch must be blocked).
  // ---------------------------------------------------------------------------
  describe('Row limit — bulk upload & bulk upsert', () => {
    it('rejects a CSV bulk upload that would push the workspace over the row cap', async () => {
      if (!tooljetDbAvailable) return;

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });
      await seedRows(usersTable.id, 497);

      const csvRows = Array.from({ length: 5 }, (_, i) => `u${i},u${i}@example.com`).join('\n');
      const csvBuffer = Buffer.from(`name,email\n${csvRows}`);

      await expect(bulkUploadService.perform(organizationId, 'users', csvBuffer)).rejects.toMatchObject({
        status: 451,
      } as Partial<HttpException>);

      // Nothing from the rejected batch should have been written.
      expect(await tableOperationsService.getRowsCount(organizationId)).toBe(497);
    }, 30_000);

    it('allows a CSV bulk upload that stays within the remaining row capacity', async () => {
      if (!tooljetDbAvailable) return;

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });
      await seedRows(usersTable.id, 497);

      const csvRows = Array.from({ length: 2 }, (_, i) => `v${i},v${i}@example.com`).join('\n');
      const csvBuffer = Buffer.from(`name,email\n${csvRows}`);

      const result = await bulkUploadService.perform(organizationId, 'users', csvBuffer);

      expect(result.processedRows).toBe(2);
      expect(await tableOperationsService.getRowsCount(organizationId)).toBe(499);
    }, 30_000);

    it('bulkUpsertRowsWithPrimaryKey rejects a batch that would exceed the row cap', async () => {
      if (!tooljetDbAvailable) return;

      await setupTestTables(appManager, tjDbManager, tableOperationsService, organizationId);
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });
      await seedRows(usersTable.id, 497);

      const rowsToUpsert = Array.from({ length: 5 }, (_, i) => ({
        id: 1000 + i,
        name: `w${i}`,
        email: `w${i}@example.com`,
      }));

      const result = await bulkUploadService.bulkUpsertRowsWithPrimaryKey(
        rowsToUpsert,
        usersTable.id,
        ['id'],
        organizationId
      );

      expect(result.status).toBe('failed');
      expect(result.error).toContain("You've reached your limit of rows in ToolJet database tables");
      expect(await tableOperationsService.getRowsCount(organizationId)).toBe(497);
    }, 30_000);
  });
});
});
