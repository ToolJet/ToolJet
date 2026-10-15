import { DataSource } from '@entities/data_source.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { EntityManager } from 'typeorm';
import { DataSourceScopes, DataSourceTypes } from '../constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { ConfigService } from '@nestjs/config';
import { DataSourcesUtilService } from '../util.service';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { Metadata } from '@entities/metadata.entity';
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { ClientConfig } from 'pg';
import {
  assertSampleDbRoleNotElevated,
  provisionSampleDbRole,
  sampleDbAdminConfig,
  sampleDbRole,
} from '@helpers/sample-db-role.helper';
import { SAMPLE_SQL_DISABLED_KEY } from '../constants';

const SAMPLE_DB_NAME = 'sample_db';
const FINGERPRINT_KEY = 'sampleDataSourceFingerprint';

export type SampleDbCredentials = { host: string; port: string; user: string; password: string; disabled?: boolean };

type SampleConnectionOption = { key: string; value: unknown; encrypted?: boolean };

export function sampleDbFingerprint(options: SampleConnectionOption[]): string {
  return createHash('sha256').update(JSON.stringify(options)).digest('hex');
}

@Injectable()
export class SampleDataSourceService {
  private readonly logger = new Logger(SampleDataSourceService.name);
  private credentials?: Promise<SampleDbCredentials>;

  constructor(
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly configService: ConfigService,
    protected readonly dataSourceUtilService: DataSourcesUtilService
  ) {}

  protected async getAllSampleDataSource(organizationId?: string, manager?: EntityManager): Promise<DataSource[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.find(DataSource, {
        where: {
          ...(organizationId && { organizationId }),
          type: DataSourceTypes.SAMPLE,
        },
      });
    }, manager);
  }

  sampleDbCredentials(): Promise<SampleDbCredentials> {
    return (this.credentials ??= this.resolveCredentials());
  }

  // Never the application user: if the role can't be provisioned, sample SQL is disabled.
  protected async resolveCredentials(): Promise<SampleDbCredentials> {
    const get = (key: string) => this.configService.get<string>(key);
    const host = get('SAMPLE_PG_DB_HOST') || get('PG_HOST');
    const port = get('SAMPLE_PG_DB_PORT') || get('PG_PORT');

    const admin = this.adminConfig(host, port);

    const operatorUser = get('SAMPLE_PG_DB_USER');
    const user = operatorUser || sampleDbRole(get('LOCKBOX_MASTER_KEY')).name;
    try {
      if (operatorUser) {
        await assertSampleDbRoleNotElevated(admin, operatorUser);
        return { host, port, user, password: get('SAMPLE_PG_DB_PASS') || get('PG_PASS') };
      }
      const role = sampleDbRole(get('LOCKBOX_MASTER_KEY'));
      await provisionSampleDbRole(admin, role);
      return { host, port, user, password: role.password };
    } catch (error) {
      this.logger.error(
        `Sample data source disabled: ${user} is not a usable restricted role (${error?.message}). ` +
          "Set SAMPLE_PG_DB_USER/SAMPLE_PG_DB_PASS to a restricted user, or allow ToolJet's database user to create roles, then restart."
      );
      // Empty password: Postgres rejects every login on every code path.
      return { host, port, user, password: '', disabled: true };
    }
  }

  // Same server and admin user populate-sample-db uses.
  protected adminConfig(host: string, port: string): ClientConfig {
    const get = (key: string) => this.configService.get<string>(key);
    return sampleDbAdminConfig({
      SAMPLE_PG_DB_HOST: host,
      SAMPLE_PG_DB_PORT: port,
      SAMPLE_PG_DB_USER: get('PG_USER'),
      SAMPLE_PG_DB_PASS: get('PG_PASS'),
      SAMPLE_DB: get('SAMPLE_DB') || SAMPLE_DB_NAME,
      CA_CERT: get('CA_CERT'),
    });
  }

  protected connectionOptions({
    host,
    port,
    user,
    password,
    disabled = false,
  }: SampleDbCredentials): SampleConnectionOption[] {
    return [
      { key: 'host', value: host, encrypted: true },
      { key: 'port', value: port, encrypted: true },
      { key: 'database', value: SAMPLE_DB_NAME },
      { key: 'username', value: user, encrypted: true },
      { key: 'password', value: password, encrypted: true },
      { key: 'ssl_enabled', value: this.configService.get<string>('PGSSLMODE') === 'require', encrypted: false },
      { key: 'ssl_certificate', value: 'none', encrypted: false },
      { key: 'connection_type', value: 'manual', encrypted: false },
      { key: SAMPLE_SQL_DISABLED_KEY, value: disabled, encrypted: false },
    ];
  }

  // Boot: re-point sample data sources only when their options changed. Lock: replicas boot together.
  async syncSampleDataSources(): Promise<boolean> {
    const fingerprint = sampleDbFingerprint(this.connectionOptions(await this.sampleDbCredentials()));
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('tooljet_sample_data_source_sync'))");
      const [metadata] = await manager.find(Metadata);
      if (metadata?.data?.[FINGERPRINT_KEY] === fingerprint) return false;

      await this.updateSampleDs(manager);
      const data = { ...metadata?.data, [FINGERPRINT_KEY]: fingerprint };
      if (metadata) await manager.update(Metadata, metadata.id, { data });
      else await manager.save(manager.create(Metadata, { data }));
      return true;
    });
  }

  async updateSampleDs(manager?: EntityManager) {
    const options = this.connectionOptions(await this.sampleDbCredentials());
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const allSampleDs = await this.getAllSampleDataSource(null, manager);
      if (!allSampleDs?.length) {
        return;
      }
      for (const ds of allSampleDs) {
        const { organizationId } = ds;
        const newOptions = await this.dataSourceUtilService.parseOptionsForUpdate(ds, options, manager);
        const allEnvs = await this.appEnvironmentUtilService.getAll(organizationId);
        await Promise.all(
          allEnvs.map(async (envToUpdate) => {
            await this.appEnvironmentUtilService.updateOptions(newOptions, envToUpdate.id, ds.id, manager);
          })
        );
      }
    }, manager);
  }

  async createSampleDB(organizationId, manager?: EntityManager) {
    const config = {
      name: 'Sample data source',
      kind: 'postgresql',
      type: DataSourceTypes.SAMPLE,
      scope: DataSourceScopes.GLOBAL,
      organizationId,
    };
    const options = this.connectionOptions(await this.sampleDbCredentials());

    await dbTransactionWrap(async (manager: EntityManager) => {
      const dataSource = manager.create(DataSource, config);
      await manager.save(dataSource);

      const allEnvs: AppEnvironment[] = await this.appEnvironmentUtilService.getAll(organizationId, null, manager);

      await Promise.all(
        allEnvs?.map(async (env) => {
          const parsedOptions = await this.dataSourceUtilService.parseOptionsForCreate(options);
          await manager.save(
            manager.create(DataSourceOptions, {
              environmentId: env.id,
              dataSourceId: dataSource.id,
              options: parsedOptions,
            })
          );
        })
      );
    }, manager);
  }
}
