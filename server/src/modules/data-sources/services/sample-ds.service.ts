import { DataSource } from '@entities/data_source.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { EntityManager } from 'typeorm';
import { DataSourceScopes, DataSourceTypes } from '../constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { ConfigService } from '@nestjs/config';
import { DataSourcesUtilService } from '../util.service';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSourceVersionOptions } from '@entities/data_source_version_options.entity';
import { DataSourcesRepository } from '../repository';
import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { ClientConfig } from 'pg';
import { provisionSampleDbRole, sampleDbAdminConfig, sampleDbRole } from '@helpers/sample-db-role.helper';
import { SAMPLE_FINGERPRINT_KEY, SAMPLE_SQL_DISABLED_KEY } from '../constants';

const SAMPLE_DB_NAME = 'sample_db';

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

  // Never the admin user: if the role can't be provisioned, sample SQL is disabled.
  protected async resolveCredentials(): Promise<SampleDbCredentials> {
    const get = (key: string) => this.configService.get<string>(key);
    const host = get('SAMPLE_PG_DB_HOST') || get('PG_HOST');
    const port = get('SAMPLE_PG_DB_PORT') || get('PG_PORT');
    const role = sampleDbRole(get('LOCKBOX_MASTER_KEY'));
    const admin = this.adminConfig(host, port);
    try {
      await provisionSampleDbRole(admin, role);
      return { host, port, user: role.name, password: role.password };
    } catch (error) {
      this.logger.error(
        `Sample data source disabled: ${admin.user} could not set up the restricted role ${role.name} (${error?.message}). ` +
          'Give SAMPLE_PG_DB_USER (or PG_USER) permission to create roles, then restart.'
      );
      // Empty password: Postgres rejects every login on every code path.
      return { host, port, user: role.name, password: '', disabled: true };
    }
  }

  // Same server and admin user populate-sample-db uses.
  protected adminConfig(host: string, port: string): ClientConfig {
    const get = (key: string) => this.configService.get<string>(key);
    return sampleDbAdminConfig({
      SAMPLE_PG_DB_HOST: host,
      SAMPLE_PG_DB_PORT: port,
      SAMPLE_PG_DB_USER: get('SAMPLE_PG_DB_USER') || get('PG_USER'),
      SAMPLE_PG_DB_PASS: get('SAMPLE_PG_DB_PASS') || get('PG_PASS'),
      SAMPLE_DB: this.sampleDbName(),
      CA_CERT: get('CA_CERT'),
    });
  }

  protected sampleDbName(): string {
    return this.configService.get<string>('SAMPLE_DB') || SAMPLE_DB_NAME;
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
      { key: 'database', value: this.sampleDbName() },
      { key: 'username', value: user, encrypted: true },
      { key: 'password', value: password, encrypted: true },
      { key: 'ssl_enabled', value: this.configService.get<string>('PGSSLMODE') === 'require', encrypted: false },
      { key: 'ssl_certificate', value: 'none', encrypted: false },
      { key: 'connection_type', value: 'manual', encrypted: false },
      { key: SAMPLE_SQL_DISABLED_KEY, value: disabled, encrypted: false },
    ];
  }

  // Stored on each sample data source, so boot sync finds stale ones without decrypting.
  protected optionsWithFingerprint(credentials: SampleDbCredentials): SampleConnectionOption[] {
    const options = this.connectionOptions(credentials);
    return [...options, { key: SAMPLE_FINGERPRINT_KEY, value: sampleDbFingerprint(options), encrypted: false }];
  }

  // Boot: re-point sample data sources whose stored options are stale. Lock: replicas boot together.
  async syncSampleDataSources(): Promise<boolean> {
    const credentials = await this.sampleDbCredentials();
    const fingerprint = sampleDbFingerprint(this.connectionOptions(credentials));
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.query("SELECT pg_advisory_xact_lock(hashtext('tooljet_sample_data_source_sync'))");
      const stale = await manager
        .createQueryBuilder(DataSource, 'ds')
        .where('ds.type = :type', { type: DataSourceTypes.SAMPLE })
        .andWhere(
          `EXISTS (SELECT 1 FROM data_source_versions dsv
            JOIN data_source_version_options dsvo ON dsvo.data_source_version_id = dsv.id
            WHERE dsv.data_source_id = ds.id
              AND (dsvo.options::jsonb -> :key ->> 'value') IS DISTINCT FROM :fingerprint)`,
          { key: SAMPLE_FINGERPRINT_KEY, fingerprint }
        )
        .getMany();
      if (!stale.length) return false;
      await this.updateSampleDs(manager, stale);
      return true;
    });
  }

  /**
   * IMPORTANT: Do not modify this function signature - it is used in data migrations.
   *
   * Used in migrations:
   * - 1726649944702-AddConnectionTypeToSampleDataSources.ts
   * - 1731279588337-ReplaceTheSampleDBConnectionValues.ts
   */
  async updateSampleDs(manager?: EntityManager, dataSources?: DataSource[]) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const sampleDataSources = dataSources ?? (await this.getAllSampleDataSource(null, manager));
      if (!sampleDataSources?.length) return;
      const options = this.optionsWithFingerprint(await this.sampleDbCredentials());
      for (const dataSource of sampleDataSources) {
        const newOptions = await this.dataSourceUtilService.parseOptionsForUpdate(dataSource, options, manager);
        // Every branch's version: queries on a branch read its own options.
        await manager
          .createQueryBuilder()
          .update(DataSourceVersionOptions)
          .set({ options: newOptions, updatedAt: new Date() })
          .where('data_source_version_id IN (SELECT id FROM data_source_versions WHERE data_source_id = :id)', {
            id: dataSource.id,
          })
          .execute();
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
    const options = this.optionsWithFingerprint(await this.sampleDbCredentials());

    await dbTransactionWrap(async (manager: EntityManager) => {
      const dataSource = manager.create(DataSource, config);
      await manager.save(dataSource);

      const allEnvs: AppEnvironment[] = await this.appEnvironmentUtilService.getAll(organizationId, null, manager);

      // Create the default-branch DataSourceVersion + DataSourceVersionOptions
      const defaultBranchId = await DataSourcesRepository.resolveDefaultBranchId(manager, organizationId);
      const dsv = manager.create(DataSourceVersion, {
        dataSourceId: dataSource.id,
        name: dataSource.name,
        isActive: true,
        branchId: defaultBranchId,
      });
      const savedDsv = await manager.save(DataSourceVersion, dsv);

      await Promise.all(
        allEnvs?.map(async (env) => {
          const parsedOptions = await this.dataSourceUtilService.parseOptionsForCreate(options, false, manager);
          await manager.save(
            manager.create(DataSourceVersionOptions, {
              dataSourceVersionId: savedDsv.id,
              environmentId: env.id,
              options: parsedOptions,
            })
          );
        })
      );
    }, manager);
  }
}
