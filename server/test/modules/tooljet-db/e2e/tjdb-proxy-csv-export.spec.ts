/** @jest-environment setup-polly-jest/jest-environment-node */

/**
 * PostgrestProxyService — Accept: text/csv passthrough.
 *
 * Polly.js intercepts the PostgREST HTTP call and returns a canned CSV/JSON body depending on
 * the Accept header PostgrestProxyService actually forwarded, so this runs without a live
 * PostgREST instance.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import { ensureWorkspaceSchema, ensureTenantRole } from '../../../../test/tooljet-db-test.helper';
import * as request from 'supertest';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';
import {
  createUser,
  initTestApp,
  login,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
} from 'test-helper';

describe('PostgrestProxyService', () => {
  describe('EE (plan: enterprise) | GET /api/tooljet-db/proxy/:tableId | Accept header', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let adminOrgId: string;
    let tooljetDbAvailable: boolean;
    let tableId: string;

    const TABLE_NAME = 'test_proxy_csv_export';
    const CSV_BODY = 'id,name\n1,Alice\n';

    const context = setupPolly({
      adapters: [NodeHttpAdapter as any],
      persister: FSPersister as any,
      recordFailedRequests: true,
      persisterOptions: {
        fs: {
          recordingsDir: path.resolve(
            __dirname,
            `../../__fixtures__/${path.basename(__filename).replace(/\.[tj]s$/, '')}`
          ),
        },
      },
    });

    // Use imported ensureWorkspaceSchema and ensureTenantRole

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

      if (tooljetDbAvailable) {
        tooljetDbAvailable = await ensureWorkspaceSchema(adminOrgId);
      }
      if (tooljetDbAvailable) {
        tooljetDbAvailable = await ensureTenantRole(adminOrgId);
      }
      await ensureAppEnvironments(app, adminOrgId);

      const auth = await login(app);
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
        tableId = res.body?.result?.id;
        expect(tableId).toBeDefined();
      }
    });

    afterAll(async () => {
      await closeTestApp(app);
    });

    beforeEach(() => {
      context.polly.server
        .any()
        .filter((req) => req.hostname === '127.0.0.1')
        .intercept((_req, _res, interceptor) => {
          interceptor.passthrough();
        });

      // GET | respond CSV only when the proxy forwarded Accept: text/csv, JSON otherwise —
      // this is the behaviour under test, not a fixed mock.
      context.polly.server.get('http://localhost:3001/*').intercept((req, res) => {
        if (req.getHeader('Accept') === 'text/csv') {
          res.status(200);
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.send(CSV_BODY);
          return;
        }
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.json([{ id: 1, name: 'Alice' }]);
      });
    });

    it('should return text/csv with a header row when the client requests Accept: text/csv', async function () {
      expect(tooljetDbAvailable).toBe(true);

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${tableId}`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId)
        .set('Accept', 'text/csv');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text.split('\n')[0]).toBe('id,name');
    });

    it('should still return JSON when no Accept header is sent', async function () {
      expect(tooljetDbAvailable).toBe(true);

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${tableId}`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('should still return JSON when the client requests Accept: application/json', async function () {
      expect(tooljetDbAvailable).toBe(true);

      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/proxy/${tableId}`)
        .set('Cookie', adminCookie)
        .set('tj-workspace-id', adminOrgId)
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
