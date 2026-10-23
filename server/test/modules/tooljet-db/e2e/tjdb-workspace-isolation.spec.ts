/**
 * A session for workspace A must never read or change workspace B's ToolJet DB tables by putting
 * B's id in the route. App join queries run in-process, so the HTTP join route must not exist.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createUser, initTestApp, login, closeTestApp, getDefaultDataSource, withRealTransactions } from 'test-helper';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';

const CANARY = 'canary-workspace-b';

const columns = [
  {
    column_name: 'id',
    data_type: 'serial',
    constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
  },
  { column_name: 'secret', data_type: 'character varying', constraints_type: {} },
];

describe('TooljetDb workspace isolation', () => {
  let app: INestApplication;
  let orgAId: string;
  let orgBId: string;
  let tableBId: string;
  let otherTableBId: string;
  let cookieA: string[];

  const asAdminA = (req: request.Test) => req.set({ Cookie: cookieA, 'tj-workspace-id': orgAId });

  beforeAll(async () => {
    ({ app } = await initTestApp());

    // Join connects as the workspace's own TJDB role, which can't see rows still inside the
    // suite transaction, so the seed commits for real.
    await withRealTransactions(async () => {
      const adminA = await createUser(app, { email: 'tjdb-iso-a@tooljet.io', groups: ['admin', 'end-user'] });
      const adminB = await createUser(app, { email: 'tjdb-iso-b@tooljet.io', groups: ['admin', 'end-user'] });
      orgAId = adminA.organization.id;
      orgBId = adminB.organization.id;
      // createUser seeds the workspace but not its TJDB tenant schema.
      await app
        .get(TooljetDbTableOperationsService)
        .createTooljetDbTenantSchemaAndRole(orgBId, getDefaultDataSource().manager);

      const { tokenCookie: cookieB } = await login(app, 'tjdb-iso-b@tooljet.io');
      const createTableInB = async (table_name: string): Promise<string> => {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${orgBId}/table`)
          .set({ Cookie: cookieB, 'tj-workspace-id': orgBId })
          .send({ table_name, columns, foreign_keys: [] })
          .expect(201);
        return res.body.result.id;
      };
      tableBId = await createTableInB('b_secrets');
      otherTableBId = await createTableInB('b_owners');
      await app
        .get<EntityManager>(getEntityManagerToken('tooljetDb'))
        .query(`INSERT INTO "workspace_${orgBId}"."${tableBId}" (secret) VALUES ($1)`, [CANARY]);
    });

    ({ tokenCookie: cookieA } = await login(app, 'tjdb-iso-a@tooljet.io'));
  });

  afterAll(async () => {
    await withRealTransactions(() =>
      app.get(TooljetDbTableOperationsService).deleteTooljetDbTenantSchemaAndRole(orgBId)
    );
    await closeTestApp(app);
  }, 60_000);

  // Join collects its tables from the join conditions, and rejects a self-join.
  const joinBody = () => {
    const idOf = (table: string) => ({ type: 'Column', table, columnName: 'id' });
    return {
      from: { name: tableBId, type: 'Table' },
      fields: [{ table: tableBId, name: 'secret' }],
      joins: [
        {
          joinType: 'LEFT',
          table: otherTableBId,
          conditions: {
            conditionsList: [{ leftField: idOf(tableBId), operator: '=', rightField: idOf(otherTableBId) }],
          },
        },
      ],
    };
  };

  describe('POST /api/tooljet-db/organizations/:organizationId/join | removed route', () => {
    it('should 404 a workspace A admin targeting workspace B', async () => {
      const res = await asAdminA(
        request.agent(app.getHttpServer()).post(`/api/tooljet-db/organizations/${orgBId}/join`)
      ).send(joinBody());

      expect(JSON.stringify(res.body)).not.toContain(CANARY);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/tooljet-db/organizations/:organizationId/tables | other workspace', () => {
    it('should 403 a workspace A admin listing workspace B tables', async () => {
      const res = await asAdminA(
        request.agent(app.getHttpServer()).get(`/api/tooljet-db/organizations/${orgBId}/tables`)
      );

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/tooljet-db/organizations/:organizationId/table | other workspace', () => {
    it('should 403 a workspace A admin creating a table in workspace B', async () => {
      const res = await asAdminA(
        request.agent(app.getHttpServer()).post(`/api/tooljet-db/organizations/${orgBId}/table`)
      ).send({ table_name: 'from_a', columns, foreign_keys: [] });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('in-process join | app query path', () => {
    it('should still join workspace B tables for workspace B', async () => {
      const result = await app
        .get(TooljetDbTableOperationsService)
        .perform(orgBId, 'join_tables', { joinQueryJson: joinBody() });

      expect(JSON.stringify(result)).toContain(CANARY);
    });
  });
});
