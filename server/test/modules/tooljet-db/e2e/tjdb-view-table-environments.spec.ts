/**
 * view_table per-environment read: `GET .../table/:tableName` must read column_names/configurations
 * off the resolved environment's `InternalTableRelation`, not off `internal_tables` (which no longer
 * carries those columns) or unconditionally off development. Simulates a baseline-repair-shaped
 * divergence — production's relation carries an extra column dev's does not — and asserts an explicit
 * `environment_id` query param actually changes which relation's shape comes back.
 *
 * @group database
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  login,
  logout,
  getDefaultDataSource,
  getTooljetDbDataSource,
  closeTestApp,
  ensureAppEnvironments,
} from 'test-helper';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';

describe('TooljetDbController | view_table environments', () => {
  describe('EE (plan: enterprise, multi-environment licensed)', () => {
    let app: INestApplication;
    let adminCookie: string[];
    let orgId: string;
    let tenantSchema: string;
    let tjdbAvailable: boolean;
    let productionEnvId: string;

    const headers = (cookie: string[]) => ({ Cookie: cookie, 'tj-workspace-id': orgId });

    const idColumn = {
      column_name: 'id',
      data_type: 'integer',
      constraints_type: { is_not_null: true, is_primary_key: true, is_unique: false },
    };

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      tjdbAvailable = !!getTooljetDbDataSource();

      const { user } = await createUser(app, {
        email: 'view-table-env-admin@tooljet.io',
        firstName: 'Admin',
        lastName: 'User',
        groups: ['admin', 'end-user'],
      });
      orgId = user.defaultOrganizationId;
      tenantSchema = `workspace_${orgId}`;

      const environments = await ensureAppEnvironments(app, orgId);
      productionEnvId = environments.reduce((highest, current) =>
        current.priority > highest.priority ? current : highest
      ).id;

      if (tjdbAvailable) {
        try {
          await getTooljetDbDataSource().query(`CREATE SCHEMA IF NOT EXISTS "${tenantSchema}"`);
          const [existingRole] = await getTooljetDbDataSource().query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [
            `user_${orgId}`,
          ]);
          if (!existingRole) await getTooljetDbDataSource().query(`CREATE ROLE "user_${orgId}"`);
        } catch {
          tjdbAvailable = false;
        }
      }

      ({ tokenCookie: adminCookie } = await login(app, 'view-table-env-admin@tooljet.io'));
    });

    afterEach(async () => {
      await logout(app, adminCookie, orgId);
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    it('should reflect the requested environment relation, not development, when environment_id is given', async () => {
      expect(tjdbAvailable).toBe(true);

      await request
        .agent(app.getHttpServer())
        .post(`/api/tooljet-db/organizations/${orgId}/table`)
        .set(headers(adminCookie))
        .send({ table_name: 'view_table_env_divergence', columns: [idColumn], foreign_keys: [] })
        .expect((res) => expect([200, 201]).toContain(res.statusCode));

      const internalTable = await getDefaultDataSource().manager.findOneOrFail(InternalTable, {
        where: { organizationId: orgId, tableName: 'view_table_env_divergence' },
      });
      const devRelation = await getDefaultDataSource().manager.findOneOrFail(InternalTableRelation, {
        where: { internalTableId: internalTable.id },
      });

      // Simulate a baseline repair (or promote) that materialized production's relation with an
      // extra column dev's relation does not have — the divergence this endpoint must surface.
      const productionRelationId = uuidv4();
      await getTooljetDbDataSource().query(
        `CREATE TABLE "${tenantSchema}"."${productionRelationId}" (LIKE "${tenantSchema}"."${devRelation.id}" INCLUDING ALL)`
      );
      await getTooljetDbDataSource().query(
        `ALTER TABLE "${tenantSchema}"."${productionRelationId}" ADD COLUMN "prod_only_col" text`
      );
      const prodOnlyColumnUuid = uuidv4();
      const productionConfigurations = {
        columns: {
          column_names: {
            ...devRelation.configurations.columns.column_names,
            prod_only_col: prodOnlyColumnUuid,
          },
          configurations: {
            ...devRelation.configurations.columns.configurations,
            [prodOnlyColumnUuid]: {},
          },
        },
      };
      await getDefaultDataSource().manager.save(
        getDefaultDataSource().manager.create(InternalTableRelation, {
          id: productionRelationId,
          internalTableId: internalTable.id,
          environmentId: productionEnvId,
          branchId: devRelation.branchId,
          configurations: productionConfigurations,
        })
      );

      const devRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/view_table_env_divergence`)
        .set(headers(adminCookie));
      expect(devRes.statusCode).toBe(200);
      const devColumnNames = devRes.body.result.columns.map((c) => c.column_name);
      expect(devColumnNames).not.toContain('prod_only_col');
      expect(devRes.body.result.configurations.columns.column_names).not.toHaveProperty('prod_only_col');

      const prodRes = await request
        .agent(app.getHttpServer())
        .get(`/api/tooljet-db/organizations/${orgId}/table/view_table_env_divergence`)
        .query({ environment_id: productionEnvId })
        .set(headers(adminCookie));
      expect(prodRes.statusCode).toBe(200);
      const prodColumnNames = prodRes.body.result.columns.map((c) => c.column_name);
      expect(prodColumnNames).toContain('prod_only_col');
      expect(prodRes.body.result.configurations.columns.column_names).toHaveProperty(
        'prod_only_col',
        prodOnlyColumnUuid
      );
    });
  });
});
