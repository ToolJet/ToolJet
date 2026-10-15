import { DataSource } from '@entities/data_source.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { EntityManager } from 'typeorm';
import { DataSourceScopes, DataSourceTypes } from '../constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { ConfigService } from '@nestjs/config';
import { DataSourcesUtilService } from '../util.service';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { Injectable } from '@nestjs/common';
import { SampleDbRole, provisionSampleDbRole, sampleDbAdminConfig, sampleDbRole } from '@helpers/sample-db-role.helper';
import { buildAndValidateDatabaseConfig } from 'scripts/database-config-utils';

const SAMPLE_DB_NAME = 'sample_db';

@Injectable()
export class SampleDataSourceService {
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

  // Null when the operator supplies SAMPLE_PG_DB_USER: their credentials are used as-is.
  protected sampleDbRole(): SampleDbRole | null {
    if (this.configService.get<string>('SAMPLE_PG_DB_USER')) return null;
    return sampleDbRole(this.configService.get<string>('LOCKBOX_MASTER_KEY'));
  }

  protected connectionOptions() {
    const role = this.sampleDbRole();
    return [
      {
        key: 'host',
        value: this.configService.get<string>('SAMPLE_PG_DB_HOST') || this.configService.get<string>('PG_HOST'),
        encrypted: true,
      },
      {
        key: 'port',
        value: this.configService.get<string>('SAMPLE_PG_DB_PORT') || this.configService.get<string>('PG_PORT'),
        encrypted: true,
      },
      { key: 'database', value: SAMPLE_DB_NAME },
      {
        key: 'username',
        value: role ? role.name : this.configService.get<string>('SAMPLE_PG_DB_USER'),
        encrypted: true,
      },
      {
        key: 'password',
        value: role
          ? role.password
          : this.configService.get<string>('SAMPLE_PG_DB_PASS') || this.configService.get<string>('PG_PASS'),
        encrypted: true,
      },
      { key: 'ssl_enabled', value: this.configService.get<string>('PGSSLMODE') === 'require', encrypted: false },
      { key: 'ssl_certificate', value: 'none', encrypted: false },
      { key: 'connection_type', value: 'manual', encrypted: false },
    ];
  }

  // Same admin connection populate-sample-db uses. False when there is no role to provision.
  async provisionRestrictedRole(): Promise<boolean> {
    const role = this.sampleDbRole();
    if (!role) return false;
    const { value: envVars, error } = buildAndValidateDatabaseConfig();
    if (error) throw new Error(`Config validation error: ${error.message}`);
    await provisionSampleDbRole(sampleDbAdminConfig(envVars), role);
    return true;
  }

  async updateSampleDs(manager?: EntityManager) {
    const options = this.connectionOptions();
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
    const options = this.connectionOptions();

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
