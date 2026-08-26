/**
 * TJDB CSV export | physical table naming at the PostgREST boundary
 *
 * `exportTjdbTableAsCSV` is the one path into PostgREST that does not go through
 * `PostgrestProxyService` - it needs `Accept: text/csv` and a raw text body, which `perform()`
 * cannot return - so it resolves the relation id itself. This pins the resolved name at the
 * boundary by asserting the URL `got.get` is called with.
 *
 * No live PostgREST is needed (or available under this harness): `got.get` is mocked, which is
 * exactly the seam the assertion is about. Booting the real app also proves the resolver is
 * actually injectable into the EE external-apis service.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import * as got from 'got';
import {
  createUser,
  initTestApp,
  login,
  closeTestApp,
  ensureAppEnvironments,
  getTooljetDbDataSource,
  getDefaultDataSource,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';

jest.setTimeout(120_000);

describe('ExternalApisTjdbController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let extApiToken: string;
    let adminOrgId: string;
    let adminCookie: string[];
    let tooljetDbAvailable: boolean;

    const TABLE_NAME = 'csv_export_tbl';

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
      tooljetDbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'csv-admin@tooljet.io',
        firstName: 'Csv',
        lastName: 'Admin',
        groups: ['admin', 'end-user'],
      });
      adminOrgId = user.defaultOrganizationId;
      await ensureAppEnvironments(app, adminOrgId);

      if (tooljetDbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "workspace_${adminOrgId}"`);
        } catch {
          tooljetDbAvailable = false;
        }
      }

      const auth = await login(app, 'csv-admin@tooljet.io');
      adminCookie = auth.tokenCookie;

      if (tooljetDbAvailable) {
        const res = await request
          .agent(app.getHttpServer())
          .post(`/api/tooljet-db/organizations/${adminOrgId}/table`)
          .set('Cookie', adminCookie)
          .set('tj-workspace-id', adminOrgId)
          .send({
            table_name: TABLE_NAME,
            columns: [
              {
                column_name: 'id',
                data_type: 'integer',
                constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
              },
            ],
            foreign_keys: [],
          });

        expect([200, 201]).toContain(res.statusCode);
      }
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    describe('POST /api/ext/workspace/:workspaceId/tooljet-db/tables/:tableName/export | physical table naming', () => {
      it('should request the resolved relation id from PostgREST, never the logical table id', async () => {
        if (!tooljetDbAvailable) return;

        const manager = getDefaultDataSource().manager;
        const internalTable = await manager.findOne(InternalTable, {
          where: { organizationId: adminOrgId, tableName: TABLE_NAME },
        });
        const relation = await manager.findOne(InternalTableRelation, {
          where: { internalTableId: internalTable.id },
        });

        // Guard against a vacuous assertion: if the two ids coincided, asserting the relation id
        // would pass whether or not the resolver was consulted.
        expect(relation.id).not.toBe(internalTable.id);

        const gotSpy = jest
          .spyOn(got as unknown as { get: (...args: unknown[]) => unknown }, 'get')
          .mockResolvedValue({ body: 'id\n1\n' } as never);

        const res = await request(app.getHttpServer())
          .post(`/api/ext/workspace/${adminOrgId}/tooljet-db/tables/${TABLE_NAME}/export`)
          .set('Authorization', `Basic ${extApiToken}`)
          .send({});

        expect(res.statusCode).toBe(201);
        expect(gotSpy).toHaveBeenCalledTimes(1);

        const requestedUrl = gotSpy.mock.calls[0][0] as string;
        expect(requestedUrl).toContain(`/${relation.id}?`);
        expect(requestedUrl).not.toContain(internalTable.id);
      });
    });
  });
});
