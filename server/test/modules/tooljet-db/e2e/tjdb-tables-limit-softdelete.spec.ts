/**
 * getTablesLimit() must not count soft-deleted internal_tables rows, in either edition branch
 * (Cloud filters by organizationId, non-Cloud counts globally).
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
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { LICENSE_FIELD } from '@modules/licensing/constants';

describe('TooljetDbController | getTablesLimit soft-delete exclusion', () => {
  describe.each([
    ['EE (non-Cloud)', 'ee' as const],
    ['Cloud', 'cloud' as const],
  ])('%s', (_label, edition) => {
    let app: INestApplication;
    let cookie: string[];
    let organizationId: string;
    let tooljetDbAvailable: boolean;
    let licenseTermsService: LicenseTermsService;

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
      ({ app } = await initTestApp({ edition, plan: 'enterprise' }));
      tooljetDbAvailable = !!getTooljetDbDataSource();
      licenseTermsService = app.get(LicenseTermsService);

      // The 'enterprise' test plan gives UNLIMITED tables, which short-circuits getTablesLimit
      // before it ever reaches the query under test. Force a finite TABLE_COUNT only, so table
      // creation/env resolution keep the rest of the enterprise feature set intact.
      const original = licenseTermsService.getLicenseTerms.bind(licenseTermsService);
      jest.spyOn(licenseTermsService, 'getLicenseTerms').mockImplementation(async (fields: any, orgId?: any) => {
        const resolved = await original(fields, orgId);
        if (Array.isArray(fields) && fields.includes(LICENSE_FIELD.TABLE_COUNT)) {
          return { ...resolved, [LICENSE_FIELD.TABLE_COUNT]: 1000 };
        }
        return resolved;
      });

      const { user } = await createUser(app, {
        email: `tables-limit-${edition}@tooljet.io`,
        firstName: 'Limit',
        lastName: 'Tester',
        groups: ['admin', 'end-user'],
      });
      organizationId = user.defaultOrganizationId;

      await ensureAppEnvironments(app, organizationId);

      if (tooljetDbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "workspace_${organizationId}"`);
          const [existing] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${organizationId}`,
          ]);
          if (!existing) await getTooljetDbDataSource().query(`CREATE ROLE "user_${organizationId}"`);
        } catch {
          tooljetDbAvailable = false;
        }
      }

      const auth = await login(app, `tables-limit-${edition}@tooljet.io`);
      cookie = auth.tokenCookie;
    });

    afterEach(async () => {
      await logout(app, cookie, organizationId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    async function getLimit() {
      const res = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/tables/limits/${organizationId}`)
        .set('Cookie', cookie)
        .set('tj-workspace-id', organizationId);
      expect(res.statusCode).toBe(200);
      return res.body.tablesCount.current;
    }

    async function createTable(tableName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${organizationId}/table`)
        .set('Cookie', cookie)
        .set('tj-workspace-id', organizationId)
        .send(buildCreateTablePayload(tableName));
      expect([200, 201]).toContain(res.statusCode);
    }

    async function dropTable(tableName: string) {
      const res = await request
        .agent(app.getHttpServer())
        .delete(`/api/tooljet-db/organizations/${organizationId}/table/${tableName}`)
        .set('Cookie', cookie)
        .set('tj-workspace-id', organizationId);
      expect(res.statusCode).toBe(200);
    }

    it('excludes a soft-deleted table from the count', async function () {
      expect(tooljetDbAvailable).toBe(true);

      const baseline = await getLimit();

      await createTable('limit_softdel_kept');
      await createTable('limit_softdel_dropped');
      expect(await getLimit()).toBe(baseline + 2);

      await dropTable('limit_softdel_dropped');

      // Soft-deleted row must not be counted - only the surviving table remains.
      expect(await getLimit()).toBe(baseline + 1);
    });
  });
});
