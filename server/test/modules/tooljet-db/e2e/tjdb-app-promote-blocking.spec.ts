/**
 * Task 8 (H6/DEV-90): an app cannot be promoted past its tables.
 *
 * An app promoted into an environment where a table it queries does not exist yields 404s
 * to end users at runtime — promote must block instead, the same way it already blocks on
 * an unpromoted module (checkModulesPromotableToEnvironment). Covers both call sites:
 * the manual PUT .../promote route (ee/versions/service.ts) and the External API release
 * route (ee/external-apis/service.ts).
 *
 * @group database
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  ensureAppEnvironments,
  login,
  saveEntity,
  updateEntity,
  findEntityOrFail,
  resolveOrSeedDefaultBranch,
} from 'test-helper';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { InternalTableRelation } from '@entities/internal_table_relation.entity';
import { InternalTableMigration } from '@entities/internal_table_migration.entity';
import { InternalTableMigrationApplication } from '@entities/internal_table_migration_application.entity';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { DataQuery } from '@entities/data_query.entity';

describe('An app cannot be promoted past its tables', () => {
  describe('EE (plan: enterprise)', () => {
    let nestApp: INestApplication;
    let AUTH_HEADER: string;

    beforeAll(async () => {
      process.env.ENABLE_EXTERNAL_API = 'true';
      ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      const configService = nestApp.get<ConfigService>(ConfigService);
      AUTH_HEADER = `Basic ${configService.get('EXTERNAL_API_ACCESS_TOKEN')}`;
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60_000);

    async function seedOrg(email: string) {
      const { user, organization } = await createUser(nestApp, { email, groups: ['all_users', 'admin'] });
      const cookie = (await login(nestApp, email)).tokenCookie;
      const environments = await ensureAppEnvironments(nestApp, organization.id);
      const devEnv = environments.find((e) => e.priority === 1);
      const stagingEnv = environments.find((e) => e.priority === 2);
      const prodEnv = environments.reduce((a, b) => (b.priority > a.priority ? b : a));
      return { user, organization, cookie, devEnv, stagingEnv, prodEnv };
    }

    // Registers a logical table and, unless `environments` is empty, a physical relation in
    // each given environment — mirroring what create_table + per-table promote leave behind.
    async function seedTable(
      organizationId: string,
      tableName: string,
      environments: AppEnvironment[],
      { deleted = false }: { deleted?: boolean } = {}
    ): Promise<InternalTable> {
      const table = await saveEntity(InternalTable, {
        organizationId,
        tableName,
        co_relation_id: uuidv4(),
      });
      if (deleted) {
        await updateEntity(InternalTable, table.id, { deletedAt: new Date() } as any);
      }
      const branchId = (await resolveOrSeedDefaultBranch(organizationId)).id;
      for (const env of environments) {
        await saveEntity(InternalTableRelation, {
          id: uuidv4(),
          internalTableId: table.id,
          environmentId: env.id,
          branchId,
        });
      }
      return table;
    }

    // A tooljetdb data query on `version` referencing `table` — this is what
    // findTooljetDbTables scans for.
    async function queryTable(version: AppVersion, organizationId: string, table: InternalTable) {
      // type: 'static' requires scope: 'global', which in turn requires app_version_id NULL
      // (chk_static_type_global_scope / chk_global_data_source_app_version_id) — matches how
      // the real tooljetdbdefault data source is provisioned. findTooljetDbTables joins
      // app_versions through data_queries.app_version_id, not the data source's, so this is fine.
      const ds = await saveEntity(DataSourceEntity, {
        name: 'tooljetdb',
        kind: 'tooljetdb',
        type: 'static',
        scope: 'global',
        organizationId,
      } as any);
      await saveEntity(DataQuery, {
        name: 'getRows',
        options: { table_id: table.id, operation: 'list_rows' },
        dataSourceId: ds.id,
        appVersionId: version.id,
      } as any);
    }

    // Seeds `count` confirmed migrations against `appliedRelationIds` — used to make a source
    // relation "ahead" of a target relation that only gets a subset of them.
    async function seedMigrations(table: InternalTable, branchId: string, count: number, appliedRelationIds: string[]) {
      for (let i = 0; i < count; i++) {
        const migration = await saveEntity(InternalTableMigration, {
          internalTableId: table.id,
          sequence: String(i + 1),
          branchId,
          kind: 'structured',
          payload: { op: 'noop' },
        } as any);
        for (const relationId of appliedRelationIds) {
          await saveEntity(InternalTableMigrationApplication, {
            migrationId: migration.id,
            relationId,
            appliedAt: new Date(),
          } as any);
        }
      }
    }

    async function promote(app: App, version: AppVersion, cookie: string[], organizationId: string, envId: string) {
      return request(nestApp.getHttpServer())
        .put(`/api/v2/apps/${app.id}/versions/${version.id}/promote`)
        .set('tj-workspace-id', organizationId)
        .set('Cookie', cookie)
        .send({ currentEnvironmentId: envId });
    }

    it('blocks promoting an app whose query references a table absent from the target environment', async () => {
      const { user, organization, cookie, devEnv } = await seedOrg('tjdb-promote-block@tooljet.io');
      const table = await seedTable(organization.id, 'orders', [devEnv]); // no relation in staging

      const app = await createApplication(nestApp, { name: 'App-Block', user, type: 'front-end' });
      const version = await createApplicationVersion(nestApp, app as any);
      await queryTable(version, organization.id, table);

      const response = await promote(app as any, version, cookie, organization.id, devEnv.id);

      expect(response.statusCode).toBe(400);
      const message = response.body.message.error ?? response.body.message;
      expect(message).toContain('orders');

      // Nothing promoted: the version never left development.
      const reloaded = await findEntityOrFail(AppVersion, { id: version.id });
      expect(reloaded.currentEnvironmentId).toBe(devEnv.id);
    });

    it('allows the promote once the table has been promoted to the target environment first', async () => {
      const { user, organization, cookie, devEnv, stagingEnv } = await seedOrg('tjdb-promote-allow@tooljet.io');
      const table = await seedTable(organization.id, 'orders', [devEnv, stagingEnv]); // promoted already

      const app = await createApplication(nestApp, { name: 'App-Allow', user, type: 'front-end' });
      const version = await createApplicationVersion(nestApp, app as any);
      await queryTable(version, organization.id, table);

      const response = await promote(app as any, version, cookie, organization.id, devEnv.id);

      expect(response.statusCode).toBe(200);
    });

    it('warns, but does not block, when the table resolves in the target but is missing migrations there', async () => {
      const { user, organization, cookie, devEnv, stagingEnv } = await seedOrg('tjdb-promote-warn@tooljet.io');
      const table = await seedTable(organization.id, 'orders', [devEnv, stagingEnv]); // relation exists both places
      const branchId = (await resolveOrSeedDefaultBranch(organization.id)).id;
      const devRelation = await findEntityOrFail(InternalTableRelation, {
        internalTableId: table.id,
        environmentId: devEnv.id,
      });
      const stagingRelation = await findEntityOrFail(InternalTableRelation, {
        internalTableId: table.id,
        environmentId: stagingEnv.id,
      });
      // 5 migrations confirmed on dev (source); staging (target) only has 3 of them.
      await seedMigrations(table, branchId, 3, [devRelation.id, stagingRelation.id]);
      await seedMigrations(table, branchId, 2, [devRelation.id]);

      const app = await createApplication(nestApp, { name: 'App-Warn', user, type: 'front-end' });
      const version = await createApplicationVersion(nestApp, app as any);
      await queryTable(version, organization.id, table);

      const response = await promote(app as any, version, cookie, organization.id, devEnv.id);

      expect(response.statusCode).toBe(200);
      expect(response.body.tableWarnings).toEqual([
        expect.objectContaining({ tableId: table.id, tableName: 'orders', missingCount: 2 }),
      ]);

      // Still promoted — a behind-but-present table is informational only, never a block.
      const reloaded = await findEntityOrFail(AppVersion, { id: version.id });
      expect(reloaded.currentEnvironmentId).toBe(stagingEnv.id);
    });

    it('does not block on a soft-deleted table', async () => {
      const { user, organization, cookie, devEnv } = await seedOrg('tjdb-promote-softdel@tooljet.io');
      // Deleted table has a relation in dev only — would block if the soft-delete filter
      // (Task 0's findTooljetDbTables fix) were not in effect.
      const table = await seedTable(organization.id, 'archived', [devEnv], { deleted: true });

      const app = await createApplication(nestApp, { name: 'App-SoftDel', user, type: 'front-end' });
      const version = await createApplicationVersion(nestApp, app as any);
      await queryTable(version, organization.id, table);

      const response = await promote(app as any, version, cookie, organization.id, devEnv.id);

      expect(response.statusCode).toBe(200);
    });

    // Second call site — the External API release route must apply the same guard, not just
    // the manual UI promote flow. Release promotes straight to the highest-priority environment.
    it('blocks the External API release route the same way', async () => {
      const { user, organization, devEnv } = await seedOrg('tjdb-promote-extapi@tooljet.io');
      const table = await seedTable(organization.id, 'orders', [devEnv]); // never reached prod

      const app = await createApplication(nestApp, { name: 'App-ExtApi', user, type: 'front-end' });
      const version = await createApplicationVersion(nestApp, app as any);
      await updateEntity(AppVersion, version.id, { status: AppVersionStatus.PUBLISHED } as any);
      await queryTable(version, organization.id, table);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: version.id })
        .expect(400);

      const message = response.body.message.error ?? response.body.message;
      expect(message).toContain('orders');
    });

    // The External API release route must surface the same tableWarnings the interactive
    // promote route does — not just log them server-side and drop them from the response.
    it('surfaces tableWarnings on the External API release route when a table is behind but present', async () => {
      const { user, organization, devEnv, prodEnv } = await seedOrg('tjdb-promote-extapi-warn@tooljet.io');
      const table = await seedTable(organization.id, 'orders', [devEnv, prodEnv]); // relation exists both places
      const branchId = (await resolveOrSeedDefaultBranch(organization.id)).id;
      const devRelation = await findEntityOrFail(InternalTableRelation, {
        internalTableId: table.id,
        environmentId: devEnv.id,
      });
      const prodRelation = await findEntityOrFail(InternalTableRelation, {
        internalTableId: table.id,
        environmentId: prodEnv.id,
      });
      // 3 migrations confirmed on dev (source) and prod (target); 2 more confirmed on dev only.
      await seedMigrations(table, branchId, 3, [devRelation.id, prodRelation.id]);
      await seedMigrations(table, branchId, 2, [devRelation.id]);

      const app = await createApplication(nestApp, { name: 'App-ExtApi-Warn', user, type: 'front-end' });
      const version = await createApplicationVersion(nestApp, app as any);
      await updateEntity(AppVersion, version.id, { status: AppVersionStatus.PUBLISHED } as any);
      await queryTable(version, organization.id, table);

      const response = await request(nestApp.getHttpServer())
        .post(`/api/ext/apps/${app.id}/git-sync/release`)
        .set('Authorization', AUTH_HEADER)
        .send({ versionId: version.id });

      expect(response.statusCode).toBe(201);
      expect(response.body.tableWarnings).toEqual([
        expect.objectContaining({ tableId: table.id, tableName: 'orders', missingCount: 2 }),
      ]);

      // Still deployed — a behind-but-present table is informational only, never a block.
      const reloaded = await findEntityOrFail(AppVersion, { id: version.id });
      expect(reloaded.currentEnvironmentId).toBe(prodEnv.id);
    });
  });
});
