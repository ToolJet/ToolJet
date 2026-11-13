import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, createUser, ensureAppEnvironments, getDefaultDataSource } from 'test-helper';
import { Client } from 'pg';
import { getEnvVars } from 'scripts/database-config-utils';
import { sampleDbRole } from '@helpers/sample-db-role.helper';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceVersionOptions } from 'src/entities/data_source_version_options.entity';
import { getImportPath } from '@modules/app/constants';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { CredentialsService } from '@modules/encryption/services/credentials.service';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import {
  SampleDataSourceService,
  SampleDbCredentials,
  sampleDbFingerprint,
} from '@modules/data-sources/services/sample-ds.service';

const env = getEnvVars();
const SPEC_DB = `sample_sync_spec_${Date.now()}_${process.pid}`;
const application = {
  PG_HOST: env.PG_HOST,
  PG_PORT: String(env.PG_PORT),
  PG_USER: env.PG_USER,
  PG_PASS: env.PG_PASS,
  SAMPLE_DB: SPEC_DB,
};
// Master key decides the role, so a new key stands in for changed credentials.
const instance = (key: string) => ({ ...application, LOCKBOX_MASTER_KEY: `${SPEC_DB}-${key}` });

async function asPostgres(sql: string): Promise<void> {
  const client = new Client({
    host: env.PG_HOST,
    port: Number(env.PG_PORT),
    user: env.PG_USER,
    password: env.PG_PASS,
    database: 'postgres',
  });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}

type Constructor<T> = new (...args: unknown[]) => T;
type SampleServiceDeps = {
  appEnvironmentUtilService: AppEnvironmentUtilService;
  dataSourceUtilService: DataSourcesUtilService;
};

// The app registers the edition's subclass, so look classes up the way the server does.
async function editionClass<T>(modulePath: string, name: string): Promise<Constructor<T>> {
  return (await import(`${await getImportPath(true)}/${modulePath}`))[name];
}

/** @group platform */
describe('SampleDataSourceService', () => {
  let nestApp: INestApplication;
  let organizationId: string;
  let credentials: CredentialsService;
  let service: (config: Record<string, string>) => SampleDataSourceService;

  async function sampleOptionRows(orgId = organizationId): Promise<DataSourceVersionOptions[]> {
    return getDefaultDataSource()
      .getRepository(DataSourceVersionOptions)
      .createQueryBuilder('dsvo')
      .innerJoin('dsvo.dataSourceVersion', 'dsv')
      .innerJoin('dsv.dataSource', 'ds')
      .where('ds.organization_id = :orgId AND ds.type = :type', { orgId, type: 'sample' })
      .getMany();
  }

  async function sampleOptions(orgId = organizationId) {
    return (await sampleOptionRows(orgId)).map(({ options }) => options);
  }

  async function sampleUsernames(orgId = organizationId): Promise<string[]> {
    const options = await sampleOptions(orgId);
    return Promise.all(options.map(({ username }) => credentials.getValue(username.credential_id)));
  }

  async function storedFingerprints(): Promise<Set<string>> {
    return new Set((await sampleOptions()).map(({ sample_fingerprint }) => sample_fingerprint?.value));
  }

  beforeAll(async () => {
    await asPostgres(`CREATE DATABASE ${SPEC_DB}`);
    ({ app: nestApp } = await initTestApp());
    const Sample = await editionClass<SampleDataSourceService>(
      'data-sources/services/sample-ds.service',
      'SampleDataSourceService'
    );
    const deps = nestApp.get(Sample) as unknown as SampleServiceDeps;
    service = (config) =>
      new Sample(deps.appEnvironmentUtilService, new ConfigService(config), deps.dataSourceUtilService);
    credentials = nestApp.get(
      await editionClass<CredentialsService>('encryption/services/credentials.service', 'CredentialsService')
    );
    const { organization } = await createUser(nestApp, { email: 'sample-sync@tooljet.io' });
    organizationId = organization.id;
    await ensureAppEnvironments(nestApp, organizationId);
    await service(instance('first')).createSampleDB(organizationId);
    // Postgres 13/14 checkpoint on CREATE DATABASE; slow while other suites write.
  }, 120_000);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
    await asPostgres(`DROP DATABASE IF EXISTS ${SPEC_DB} WITH (FORCE)`);
    for (const key of ['first', 'second']) {
      await asPostgres(`DROP ROLE IF EXISTS ${sampleDbRole(`${SPEC_DB}-${key}`).name}`);
    }
  }, 60_000);

  describe('syncSampleDataSources | Boot sync', () => {
    it('should re-point sample data sources and store the fingerprint on each when credentials changed', async () => {
      const sync = service(instance('second'));

      await expect(sync.syncSampleDataSources()).resolves.toBe(true);

      expect(new Set(await sampleUsernames())).toEqual(new Set([sampleDbRole(`${SPEC_DB}-second`).name]));
      const internals = sync as unknown as {
        connectionOptions(c: SampleDbCredentials): { key: string; value: unknown }[];
      };
      expect(await storedFingerprints()).toEqual(
        new Set([sampleDbFingerprint(internals.connectionOptions(await sync.sampleDbCredentials()))])
      );
    });

    it('should re-point only stale sample data sources, such as one created by an older replica', async () => {
      await service(instance('second')).syncSampleDataSources();
      const { organization: other } = await createUser(nestApp, { email: 'sample-sync-stale@tooljet.io' });
      await ensureAppEnvironments(nestApp, other.id);
      await service(instance('first')).createSampleDB(other.id);
      const sync = service(instance('second'));
      const update = jest.spyOn(sync, 'updateSampleDs');

      await expect(sync.syncSampleDataSources()).resolves.toBe(true);

      expect(update.mock.calls[0][1].map(({ organizationId: orgId }) => orgId)).toEqual([other.id]);
      expect(new Set(await sampleUsernames(other.id))).toEqual(new Set([sampleDbRole(`${SPEC_DB}-second`).name]));
    });

    it('should re-point sample data sources when only the SSL setting changed', async () => {
      await service(instance('second')).syncSampleDataSources();

      await expect(service({ ...instance('second'), PGSSLMODE: 'require' }).syncSampleDataSources()).resolves.toBe(
        true
      );
    });

    it('should not update sample data sources when the fingerprint is unchanged', async () => {
      await service(instance('second')).syncSampleDataSources();
      const sync = service(instance('second'));
      const update = jest.spyOn(sync, 'updateSampleDs');

      await expect(sync.syncSampleDataSources()).resolves.toBe(false);
      expect(update).not.toHaveBeenCalled();
    });

    it('should disable sample SQL instead of using the application user when the role cannot be provisioned', async () => {
      const sync = service({ ...instance('second'), SAMPLE_DB: 'no_such_database' });
      const { user: roleName } = await sync.sampleDbCredentials();

      await expect(sync.syncSampleDataSources()).resolves.toBe(true);

      expect(new Set(await sampleUsernames())).toEqual(new Set([roleName]));
      expect(roleName).not.toBe(application.PG_USER);
    });
  });

  describe('fetchServiceAndParsedParams | Running a query', () => {
    it('should reject queries on a disabled sample data source with a clear message', async () => {
      await service({ ...instance('second'), SAMPLE_DB: 'no_such_database' }).syncSampleDataSources();
      const ds = getDefaultDataSource();
      const dataSource = await ds
        .getRepository(DataSource)
        .findOneOrFail({ where: { organizationId, type: 'sample' } });
      const [{ options, environmentId }] = await sampleOptionRows();
      dataSource.options = options;
      const queries = nestApp.get(
        await editionClass<DataQueriesUtilService>('data-queries/util.service', 'DataQueriesUtilService')
      );

      await expect(
        queries.fetchServiceAndParsedParams(dataSource, { options: {} }, {}, organizationId, environmentId)
      ).rejects.toMatchObject({ message: 'Sample data source is disabled' });
    });
  });
});
