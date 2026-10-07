/**
 * @group platform
 */

/**
 * Test-connection cases stub the connector and the stored-option decryption: the e2e database
 * has no reachable external systems, and seeded credentials are not real ciphertext.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  createDataSource,
  createDataSourceOption,
  createDataQuery,
  getDefaultDataSource,
  saveEntity,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { PluginsServiceSelector } from '@ee/data-sources/services/plugin-selector.service';
import { DataSourcesUtilService } from '@ee/data-sources/util.service';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/data-sources`;
}

type SeedOption = { key: string; value: string; encrypted: boolean };

describe('ExternalApisDataSourcesControllerV2 (EE enterprise)', () => {
  let app: INestApplication;
  let envRepo: Repository<AppEnvironment>;
  let dataSourceRepo: Repository<DataSource>;
  let dataSourceVersionRepo: Repository<DataSourceVersion>;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
    const ds = getDefaultDataSource();
    envRepo = ds.getRepository(AppEnvironment);
    dataSourceRepo = ds.getRepository(DataSource);
    dataSourceVersionRepo = ds.getRepository(DataSourceVersion);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedWorkspace(tag: string) {
    const { user } = await createUser(app, { email: `dsv2-${tag}-${Date.now()}@tooljet.io` });
    const [development, staging, production] = await envRepo.find({
      where: { organizationId: user.organizationId },
      order: { priority: 'ASC' },
    });
    return { user, orgId: user.organizationId, environments: { development, staging, production } };
  }

  async function seedDataSource(
    orgId: string,
    {
      name,
      kind = 'postgresql',
      type = 'default',
      options = {},
    }: { name: string; kind?: string; type?: string; options?: Record<string, SeedOption[]> }
  ): Promise<DataSource> {
    const dataSource = await createDataSource(app, {
      application: { organizationId: orgId } as App,
      name,
      kind,
      type,
    });
    await dataSourceRepo.update(dataSource.id, { scope: 'global' } as Partial<DataSource>);
    for (const [environmentId, envOptions] of Object.entries(options)) {
      await createDataSourceOption(app, { dataSource, environmentId, options: envOptions });
    }
    return dataSource;
  }

  const postgresOptions = (host: string, password: string): SeedOption[] => [
    { key: 'host', value: host, encrypted: false },
    { key: 'password', value: password, encrypted: true },
  ];

  it('should reject a request with no token', async () => {
    const { orgId } = await seedWorkspace('auth');
    await request(app.getHttpServer()).get(base(orgId)).expect(403);
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/data-sources', () => {
    it('should list user-created and sample data sources with secrets masked', async () => {
      const { orgId, environments } = await seedWorkspace('list');
      const postgres = await seedDataSource(orgId, {
        name: 'Orders DB',
        options: {
          [environments.production.id]: postgresOptions('db.prod.internal', 'prod-secret'),
          [environments.development.id]: postgresOptions('db.dev.internal', 'dev-secret'),
        },
      });
      const sample = await seedDataSource(orgId, {
        name: 'Sample DB',
        type: 'sample',
        options: { [environments.development.id]: postgresOptions('sample.internal', 'sample-secret') },
      });
      await seedDataSource(orgId, { name: 'Built-in REST', kind: 'restapi', type: 'static' });
      const dummy = await seedDataSource(orgId, { name: 'Pulled_dummy' });
      await dataSourceRepo.update(dummy.id, { is_dummy: true } as Partial<DataSource>);
      const featureOnly = await seedDataSource(orgId, { name: 'Feature only' });
      const feature = await saveEntity(WorkspaceBranch, {
        organizationId: orgId,
        name: `feature-${Date.now()}`,
        isDefault: false,
      } as Partial<WorkspaceBranch>);
      await dataSourceVersionRepo.update({ dataSourceId: featureOnly.id }, { branchId: feature.id });

      const res = await request(app.getHttpServer()).get(base(orgId)).set('Authorization', getExtAuth()).expect(200);

      expect(res.body.pagination).toEqual({ page: 1, per_page: 20, total_count: 2 });
      expect(res.body.data).toEqual([
        {
          id: postgres.id,
          name: 'Orders DB',
          kind: 'postgresql',
          correlation_id: expect.any(String),
          options: [
            {
              environment_id: environments.development.id,
              values: [
                { key: 'host', value: 'db.dev.internal', encrypted: false },
                { key: 'password', value: '**********', encrypted: true },
              ],
            },
            {
              environment_id: environments.production.id,
              values: [
                { key: 'host', value: 'db.prod.internal', encrypted: false },
                { key: 'password', value: '**********', encrypted: true },
              ],
            },
          ],
        },
        { id: sample.id, name: 'Sample DB', kind: 'postgresql', correlation_id: expect.any(String), options: [] },
      ]);
      expect(JSON.stringify(res.body)).not.toContain('credential_id');
    });

    it('should filter by search, kind and environment, and paginate', async () => {
      const { orgId, environments } = await seedWorkspace('filters');
      await seedDataSource(orgId, {
        name: 'Orders DB',
        options: {
          [environments.development.id]: postgresOptions('db.dev.internal', 'dev-secret'),
          [environments.production.id]: postgresOptions('db.prod.internal', 'prod-secret'),
        },
      });
      await seedDataSource(orgId, {
        name: 'Payments API',
        kind: 'stripe',
        options: { [environments.development.id]: [{ key: 'api_key', value: 'sk_test', encrypted: true }] },
      });

      const byKind = await request(app.getHttpServer())
        .get(`${base(orgId)}?kind=stripe`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(byKind.body.data.map((d) => d.name)).toEqual(['Payments API']);

      const bySearch = await request(app.getHttpServer())
        .get(`${base(orgId)}?search=orders`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(bySearch.body.data.map((d) => d.name)).toEqual(['Orders DB']);

      const production = await request(app.getHttpServer())
        .get(`${base(orgId)}?environment_id=${environments.production.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(production.body.data.map((d) => [d.name, d.options.map((o) => o.environment_id)])).toEqual([
        ['Orders DB', [environments.production.id]],
        ['Payments API', []],
      ]);

      const secondPage = await request(app.getHttpServer())
        .get(`${base(orgId)}?per_page=1&page=2`)
        .set('Authorization', getExtAuth())
        .expect(200);
      expect(secondPage.body.data.map((d) => d.name)).toEqual(['Payments API']);
      expect(secondPage.body.pagination).toEqual({ page: 2, per_page: 1, total_count: 2 });
    });

    it('should reject an environment from another workspace', async () => {
      const { orgId } = await seedWorkspace('foreign-env');
      const { environments: otherEnvironments } = await seedWorkspace('foreign-env-other');

      await request(app.getHttpServer())
        .get(`${base(orgId)}?environment_id=${otherEnvironments.development.id}`)
        .set('Authorization', getExtAuth())
        .expect(422);
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/data-sources/:dataSourceId', () => {
    it('should return one data source, narrowed to an environment on request', async () => {
      const { orgId, environments } = await seedWorkspace('get');
      const postgres = await seedDataSource(orgId, {
        name: 'Orders DB',
        options: {
          [environments.development.id]: postgresOptions('db.dev.internal', 'dev-secret'),
          [environments.production.id]: postgresOptions('{{constants.prod_db_host}}', 'prod-secret'),
        },
      });

      const res = await request(app.getHttpServer())
        .get(`${base(orgId)}/${postgres.id}?environment_id=${environments.production.id}`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body).toMatchObject({
        id: postgres.id,
        name: 'Orders DB',
        options: [
          {
            environment_id: environments.production.id,
            values: [
              { key: 'host', value: '{{constants.prod_db_host}}', encrypted: false },
              { key: 'password', value: '**********', encrypted: true },
            ],
          },
        ],
      });
    });

    it('should 404 for a static, foreign or malformed data source', async () => {
      const { orgId } = await seedWorkspace('get-404');
      const { orgId: otherOrgId } = await seedWorkspace('get-404-other');
      const builtIn = await seedDataSource(orgId, { name: 'Built-in REST', kind: 'restapi', type: 'static' });
      const foreign = await seedDataSource(otherOrgId, { name: 'Elsewhere' });

      for (const id of [builtIn.id, foreign.id, 'not-a-uuid']) {
        await request(app.getHttpServer())
          .get(`${base(orgId)}/${id}`)
          .set('Authorization', getExtAuth())
          .expect(404);
      }
    });
  });

  describe('GET /api/v2/ext/workspaces/:workspaceIdentifier/data-sources/:dataSourceId/queries', () => {
    it('should list the queries that use a data source across apps, modules and workflows', async () => {
      const { user, orgId } = await seedWorkspace('queries');
      const postgres = await seedDataSource(orgId, { name: 'Orders DB' });
      const unrelated = await seedDataSource(orgId, { name: 'Other DB' });

      const seeded = [];
      for (const [name, type] of [
        ['Bug Tracker', APP_TYPES.FRONT_END],
        ['Audit Panel', APP_TYPES.MODULE],
        ['Nightly Sync', APP_TYPES.WORKFLOW],
      ] as const) {
        const resource = await createApplication(app, { name: `${name} ${Date.now()}`, user, type });
        const version = await createApplicationVersion(app, resource as App & { organizationId: string });
        const query = await createDataQuery(app, { name: `get${type}`, dataSource: postgres, appVersion: version });
        seeded.push({
          id: query.id,
          name: query.name,
          app_id: resource.id,
          app_name: resource.name,
          version_id: version.id,
        });
      }
      const other = await createApplication(app, { name: `Unrelated ${Date.now()}`, user });
      const otherVersion = await createApplicationVersion(app, other as App & { organizationId: string });
      await createDataQuery(app, { name: 'getOther', dataSource: unrelated, appVersion: otherVersion });

      const res = await request(app.getHttpServer())
        .get(`${base(orgId)}/${postgres.id}/queries`)
        .set('Authorization', getExtAuth())
        .expect(200);

      expect(res.body.pagination).toEqual({ page: 1, per_page: 20, total_count: 3 });
      expect(res.body.data).toEqual(expect.arrayContaining(seeded));
    });
  });

  describe('POST /api/v2/ext/workspaces/:workspaceIdentifier/data-sources/:dataSourceId/test-connection', () => {
    function stubConnector(testConnection?: jest.Mock) {
      jest
        .spyOn(app.get(PluginsServiceSelector), 'getService')
        .mockResolvedValue(testConnection ? { testConnection } : {});
      return jest
        .spyOn(app.get(DataSourcesUtilService), 'parseSourceOptions')
        .mockResolvedValue({ host: 'db.dev.internal', password: 'dev-secret' });
    }

    it('should test the stored configuration of the lowest environment by default', async () => {
      const { orgId, environments } = await seedWorkspace('test-ok');
      const postgres = await seedDataSource(orgId, {
        name: 'Orders DB',
        options: { [environments.development.id]: postgresOptions('db.dev.internal', 'dev-secret') },
      });
      const testConnection = jest.fn().mockResolvedValue({ status: 'ok' });
      const parseSpy = stubConnector(testConnection);

      const res = await request(app.getHttpServer())
        .post(`${base(orgId)}/${postgres.id}/test-connection`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(200);

      expect(res.body).toEqual({ status: 'ok' });
      expect(parseSpy.mock.calls[0][2]).toBe(environments.development.id);
      expect(testConnection).toHaveBeenCalledWith({ host: 'db.dev.internal', password: 'dev-secret' });
    });

    it('should report a failed connection without leaking the stored secret', async () => {
      const { orgId, environments } = await seedWorkspace('test-failed');
      const postgres = await seedDataSource(orgId, {
        name: 'Orders DB',
        options: { [environments.development.id]: postgresOptions('db.dev.internal', 'dev-secret') },
      });
      stubConnector(jest.fn().mockRejectedValue(new Error('password authentication failed: dev-secret')));

      const res = await request(app.getHttpServer())
        .post(`${base(orgId)}/${postgres.id}/test-connection`)
        .set('Authorization', getExtAuth())
        .send({ environment_id: environments.development.id })
        .expect(200);

      expect(res.body).toEqual({ status: 'failed', message: 'password authentication failed: ********' });
    });

    it('should reject a connector without a connection test, or an environment with no configuration', async () => {
      const { orgId, environments } = await seedWorkspace('test-422');
      const postgres = await seedDataSource(orgId, {
        name: 'Orders DB',
        options: { [environments.development.id]: postgresOptions('db.dev.internal', 'dev-secret') },
      });

      stubConnector();
      await request(app.getHttpServer())
        .post(`${base(orgId)}/${postgres.id}/test-connection`)
        .set('Authorization', getExtAuth())
        .send({})
        .expect(422);

      jest.restoreAllMocks();
      stubConnector(jest.fn().mockResolvedValue({ status: 'ok' }));
      await request(app.getHttpServer())
        .post(`${base(orgId)}/${postgres.id}/test-connection`)
        .set('Authorization', getExtAuth())
        .send({ environment_id: environments.production.id })
        .expect(422);
    });
  });
});
