import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initTestApp, closeTestApp, createUser, ensureAppEnvironments, getDefaultDataSource } from 'test-helper';
import { getEnvVars } from 'scripts/database-config-utils';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { Metadata } from 'src/entities/metadata.entity';
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
const application = {
  PG_HOST: env.PG_HOST,
  PG_PORT: String(env.PG_PORT),
  PG_USER: env.PG_USER,
  PG_PASS: env.PG_PASS,
  SAMPLE_DB: 'postgres',
  LOCKBOX_MASTER_KEY: `sample-sync-spec-${Date.now()}`,
};
const operator = (user: string) => ({ ...application, SAMPLE_PG_DB_USER: user, SAMPLE_PG_DB_PASS: `${user}_pw` });

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

  async function sampleUsernames(): Promise<string[]> {
    const ds = getDefaultDataSource();
    const sources = await ds.getRepository(DataSource).find({ where: { organizationId, type: 'sample' } });
    const options = await ds
      .getRepository(DataSourceOptions)
      .find({ where: sources.map(({ id }) => ({ dataSourceId: id })) });
    return Promise.all(options.map(({ options }) => credentials.getValue(options.username.credential_id)));
  }

  async function storedFingerprint(): Promise<string | undefined> {
    const [metadata] = await getDefaultDataSource().getRepository(Metadata).find();
    return metadata?.data?.sampleDataSourceFingerprint;
  }

  beforeAll(async () => {
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
    await service(operator('first_user')).createSampleDB(organizationId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  describe('syncSampleDataSources | Boot sync', () => {
    it('should re-point sample data sources and store the fingerprint when credentials changed', async () => {
      const sync = service(operator('second_user'));

      await expect(sync.syncSampleDataSources()).resolves.toBe(true);

      expect(new Set(await sampleUsernames())).toEqual(new Set(['second_user']));
      const internals = sync as unknown as {
        connectionOptions(c: SampleDbCredentials): { key: string; value: unknown }[];
      };
      expect(await storedFingerprint()).toBe(
        sampleDbFingerprint(internals.connectionOptions(await sync.sampleDbCredentials()))
      );
    });

    it('should re-point sample data sources when only the SSL setting changed', async () => {
      await service(operator('second_user')).syncSampleDataSources();

      await expect(service({ ...operator('second_user'), PGSSLMODE: 'require' }).syncSampleDataSources()).resolves.toBe(
        true
      );
    });

    it('should not update sample data sources when the fingerprint is unchanged', async () => {
      await service(operator('second_user')).syncSampleDataSources();
      const sync = service(operator('second_user'));
      const update = jest.spyOn(sync, 'updateSampleDs');

      await expect(sync.syncSampleDataSources()).resolves.toBe(false);
      expect(update).not.toHaveBeenCalled();
    });

    it('should disable sample SQL instead of using the application user when the role cannot be provisioned', async () => {
      const sync = service({ ...application, SAMPLE_DB: 'no_such_database' });
      const { user: roleName } = await sync.sampleDbCredentials();

      await expect(sync.syncSampleDataSources()).resolves.toBe(true);

      expect(new Set(await sampleUsernames())).toEqual(new Set([roleName]));
      expect(roleName).not.toBe(application.PG_USER);
    });
  });

  describe('fetchServiceAndParsedParams | Running a query', () => {
    it('should reject queries on a disabled sample data source with a clear message', async () => {
      await service({ ...application, SAMPLE_DB: 'no_such_database' }).syncSampleDataSources();
      const ds = getDefaultDataSource();
      const dataSource = await ds
        .getRepository(DataSource)
        .findOneOrFail({ where: { organizationId, type: 'sample' } });
      const { options, environmentId } = await ds
        .getRepository(DataSourceOptions)
        .findOneOrFail({ where: { dataSourceId: dataSource.id } });
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
