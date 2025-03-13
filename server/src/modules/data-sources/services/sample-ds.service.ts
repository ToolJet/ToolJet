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

  async updateSampleDs(manager?: EntityManager) {
    const options = [
      {
        key: 'host',
        value: this.configService.get<string>('PG_HOST'),
        encrypted: true,
      },
      {
        key: 'port',
        value: this.configService.get<string>('PG_PORT'),
        encrypted: true,
      },
      {
        key: 'database',
        value: 'sample_db',
      },
      {
        key: 'username',
        value: this.configService.get<string>('PG_USER'),
        encrypted: true,
      },
      {
        key: 'password',
        value: this.configService.get<string>('PG_PASS'),
        encrypted: true,
      },
      {
        key: 'ssl_enabled',
        value: false,
        encrypted: true,
      },
      { key: 'ssl_certificate', value: 'none', encrypted: false },
      { key: 'connection_type', value: 'manual', encrypted: false },
    ];
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
    const options = [
      {
        key: 'host',
        value: this.configService.get<string>('PG_HOST'),
        encrypted: true,
      },
      {
        key: 'port',
        value: this.configService.get<string>('PG_PORT'),
        encrypted: true,
      },
      {
        key: 'database',
        value: 'sample_db',
      },
      {
        key: 'username',
        value: this.configService.get<string>('PG_USER'),
        encrypted: true,
      },
      {
        key: 'password',
        value: this.configService.get<string>('PG_PASS'),
        encrypted: true,
      },
      {
        key: 'ssl_enabled',
        value: false,
        encrypted: true,
      },
      { key: 'ssl_certificate', value: 'none', encrypted: false },
      { key: 'connection_type', value: 'manual', encrypted: false },
    ];

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
