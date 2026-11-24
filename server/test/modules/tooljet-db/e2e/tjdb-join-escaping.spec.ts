/**
 * Join column names, JSON paths and operators must fit their grammar before reaching SQL.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
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

const CANARY = 'canary-workspace-b';
const ID_COLUMN = {
  column_name: 'id',
  data_type: 'serial',
  constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
};

describe('TooljetDb join escaping', () => {
  let app: INestApplication;
  let orgAId: string;
  let orgBId: string;
  let itemsId: string;
  let tagsId: string;
  let secretsBId: string;
  const originalSqlModeDisable = process.env.TJDB_SQL_MODE_DISABLE;

  beforeAll(async () => {
    ({ app } = await initTestApp());

    // Join runs on its own connection, which only sees committed rows.
    await withRealTransactions(async () => {
      const adminA = await createUser(app, { email: 'tjdb-join-a@tooljet.io', groups: ['admin', 'end-user'] });
      const adminB = await createUser(app, { email: 'tjdb-join-b@tooljet.io', groups: ['admin', 'end-user'] });
      orgAId = adminA.organization.id;
      orgBId = adminB.organization.id;

      const tjdb = app.get<EntityManager>(getEntityManagerToken('tooljetDb'));
      const createTable = async (orgId: string, email: string, table_name: string, columns: object[]) => {
        const { tokenCookie } = await login(app, email);
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgId}/table`)
          .set({ Cookie: tokenCookie, 'tj-workspace-id': orgId })
          .send({ table_name, columns: [ID_COLUMN, ...columns], foreign_keys: [] })
          .expect(201);
        return res.body.result.id as string;
      };

      for (const orgId of [orgAId, orgBId]) {
        await ensureAppEnvironments(app, orgId);
        await app
          .get(TooljetDbTableOperationsService)
          .createTooljetDbTenantSchemaAndRole(orgId, getDefaultDataSource().manager);
      }

      itemsId = await createTable(orgAId, 'tjdb-join-a@tooljet.io', 'items', [
        { column_name: 'label', data_type: 'character varying', constraints_type: {} },
        { column_name: 'meta', data_type: 'jsonb', constraints_type: {} },
      ]);
      tagsId = await createTable(orgAId, 'tjdb-join-a@tooljet.io', 'tags', [
        { column_name: 'item_id', data_type: 'integer', constraints_type: {} },
      ]);
      secretsBId = await createTable(orgBId, 'tjdb-join-b@tooljet.io', 'secrets', [
        { column_name: 'secret', data_type: 'character varying', constraints_type: {} },
      ]);

      // A table's first relation id equals its logical id, so these are the physical names.
      await tjdb.query(`INSERT INTO "workspace_${orgAId}"."${itemsId}" (label, meta) VALUES ($1, $2)`, [
        'first',
        { k: 'nested-value' },
      ]);
      await tjdb.query(`INSERT INTO "workspace_${orgAId}"."${tagsId}" (item_id) VALUES (1)`);
      await tjdb.query(`INSERT INTO "workspace_${orgBId}"."${secretsBId}" (secret) VALUES ($1)`, [CANARY]);
    });
  });

  afterAll(async () => {
    process.env.TJDB_SQL_MODE_DISABLE = originalSqlModeDisable;
    await withRealTransactions(async () => {
      const tableOperations = app.get(TooljetDbTableOperationsService);
      await tableOperations.deleteTooljetDbTenantSchemaAndRole(orgAId);
      await tableOperations.deleteTooljetDbTenantSchemaAndRole(orgBId);
      await resetDB();
    });
    await closeTestApp(app);
  }, 60_000);

  const itemIdColumn = () => ({ type: 'Column', table: itemsId, columnName: 'id' });

  // items LEFT JOIN tags ON items.id = tags.item_id, selecting items.label unless overridden.
  const joinQuery = (overrides: Record<string, unknown> = {}) => ({
    from: { name: itemsId, type: 'Table' },
    fields: [{ table: itemsId, name: 'label' }],
    joins: [
      {
        joinType: 'LEFT',
        table: tagsId,
        conditions: {
          operator: 'AND',
          conditionsList: [
            {
              operator: '=',
              leftField: itemIdColumn(),
              rightField: { type: 'Column', table: tagsId, columnName: 'item_id' },
            },
          ],
        },
      },
    ],
    ...overrides,
  });

  const runJoin = async (joinQueryJson: Record<string, unknown>) => {
    let outcome: { rows?: unknown; error?: string };
    await withRealTransactions(async () => {
      try {
        const rows = await app.get(TooljetDbTableOperationsService).perform(orgAId, 'join_tables', { joinQueryJson });
        outcome = { rows };
      } catch (error) {
        outcome = { error: String(error?.message ?? error) };
      }
    });
    return outcome;
  };

  // Refused before Postgres sees it, and nothing leaks.
  const expectRefused = (outcome: { rows?: unknown; error?: string }, reason: RegExp) => {
    expect(JSON.stringify(outcome)).not.toContain(CANARY);
    expect(outcome.rows).toBeUndefined();
    expect(outcome.error).toMatch(reason);
    expect(outcome.error).not.toMatch(/syntax error|permission denied|division by zero/i);
  };

  // With SQL mode off the join runs as the admin role, which can reach workspace B.
  describe.each([
    ['on', 'false'],
    ['off', 'true'],
  ])('with SQL mode %s', (_mode, sqlModeDisable) => {
    beforeAll(() => {
      process.env.TJDB_SQL_MODE_DISABLE = sqlModeDisable;
    });

    describe('JSON paths', () => {
      it('should refuse a select JSON path outside the grammar', async () => {
        const outcome = await runJoin(joinQuery({ fields: [{ table: itemsId, name: 'meta', jsonpath: '->k)' }] }));

        expectRefused(outcome, /Invalid JSON path/);
      });

      it('should refuse an order-by JSON path outside the grammar', async () => {
        const outcome = await runJoin(
          joinQuery({ order_by: [{ table: itemsId, columnName: 'meta', jsonpath: '->k; SELECT 1', direction: 'ASC' }] })
        );

        expectRefused(outcome, /Invalid JSON path/);
      });

      it('should refuse a filter JSON path outside the grammar', async () => {
        const outcome = await runJoin(
          joinQuery({
            conditions: {
              operator: 'AND',
              conditionsList: [
                {
                  operator: '=',
                  leftField: { type: 'Column', table: itemsId, columnName: 'meta', jsonpath: '->>k)' },
                  rightField: { type: 'Value', value: 'nested-value' },
                },
              ],
            },
          })
        );

        expectRefused(outcome, /Invalid JSON path/);
      });
    });

    describe("Column names | another workspace's table", () => {
      const readSecretOfB = () => `(SELECT secret FROM "workspace_${orgBId}"."${secretsBId}" LIMIT 1)`;

      it('should refuse a select column name that breaks out of its quotes', async () => {
        const outcome = await runJoin(
          joinQuery({ fields: [{ table: itemsId, name: `label", ${readSecretOfB()} AS "leak` }] })
        );

        expectRefused(outcome, /Invalid column name/);
      });

      it('should refuse an order-by column name that breaks out of its quotes', async () => {
        const outcome = await runJoin(
          joinQuery({ order_by: [{ table: itemsId, columnName: `label", ${readSecretOfB()} --`, direction: 'ASC' }] })
        );

        expectRefused(outcome, /Invalid column name/);
      });

      it('should refuse a group-by column name that breaks out of its quotes', async () => {
        const outcome = await runJoin(
          joinQuery({
            fields: [],
            aggregates: { count: { aggFx: 'count', column: 'id', table_id: itemsId } },
            group_by: { [itemsId]: [`label", ${readSecretOfB()} AS "leak`] },
          })
        );

        expectRefused(outcome, /Invalid column name/);
      });

      it("should refuse a join on another workspace's table id", async () => {
        const outcome = await runJoin(joinQuery({ from: { name: secretsBId, type: 'Table' } }));

        expectRefused(outcome, /Some tables are not found/);
      });
    });

    describe('Filter conditions', () => {
      const whereItemId = (condition: Record<string, unknown>, operator = 'AND') =>
        joinQuery({ conditions: { operator, conditionsList: [{ leftField: itemIdColumn(), ...condition }] } });

      it('should refuse an operator outside the allowed list', async () => {
        const outcome = await runJoin(
          whereItemId({ operator: '= 1 OR 1 / 0 =', rightField: { type: 'Value', value: 1 } })
        );

        expectRefused(outcome, /Invalid operator/);
      });

      it('should refuse an order-by direction other than ASC or DESC', async () => {
        const outcome = await runJoin(
          joinQuery({ order_by: [{ table: itemsId, columnName: 'label', direction: 'ASC, 1 / 0' }] })
        );

        // TypeORM's own check, pinned here so an upgrade that drops it fails this suite.
        expectRefused(outcome, /Invalid order direction/);
      });

      it('should refuse a condition combinator other than AND or OR', async () => {
        const outcome = await runJoin(
          joinQuery({
            conditions: {
              operator: 'OR 1 / 0 = 1 OR',
              conditionsList: [
                { operator: '=', leftField: itemIdColumn(), rightField: { type: 'Value', value: 1 } },
                { operator: '=', leftField: itemIdColumn(), rightField: { type: 'Value', value: 2 } },
              ],
            },
          })
        );

        expectRefused(outcome, /Invalid operator/);
      });
    });
  });

  // SQL mode on only: the admin role has no search_path to the workspace schema in the test DB.
  describe('with SQL mode on | still works', () => {
    beforeAll(() => {
      process.env.TJDB_SQL_MODE_DISABLE = 'false';
    });

    const whereItemId = (condition: Record<string, unknown>) =>
      joinQuery({ conditions: { operator: 'AND', conditionsList: [{ leftField: itemIdColumn(), ...condition }] } });

    it.each([['->>k'], ["->>'k'"], ["-> 'k'"]])(
      'should still read a nested value with the path %s',
      async (jsonpath) => {
        const outcome = await runJoin(joinQuery({ fields: [{ table: itemsId, name: 'meta', jsonpath }] }));

        expect(outcome.error).toBeUndefined();
        expect(JSON.stringify(outcome.rows)).toContain('nested-value');
      }
    );

    it('should bind a left-hand value instead of pasting its column name', async () => {
      const outcome = await runJoin(
        joinQuery({
          conditions: {
            operator: 'AND',
            conditionsList: [
              {
                operator: '=',
                leftField: { type: 'Value', value: 'same', columnName: '1 / 0' },
                rightField: { type: 'Value', value: 'same' },
              },
            ],
          },
        })
      );

      expect(outcome.error).toBeUndefined();
      expect(JSON.stringify(outcome.rows)).toContain('first');
    });

    it('should still filter with an allowed operator and a bound value', async () => {
      const outcome = await runJoin(whereItemId({ operator: '>=', rightField: { type: 'Value', value: 1 } }));

      expect(outcome.error).toBeUndefined();
      expect(JSON.stringify(outcome.rows)).toContain('first');
    });
  });
});
