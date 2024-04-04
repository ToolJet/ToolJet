import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { DataSource } from '../../src/entities/data_source.entity';
import { DataSourcesService } from './data_sources.service';
import { DataSourceScopes, DataSourceTypes } from 'src/helpers/data_source.constants';
import { EntityManager } from 'typeorm';
import { AppEnvironmentService } from './app_environments.service';

@Injectable()
export class SampleDBService {
  constructor(
    private dataSourceService: DataSourcesService,
    private configService: ConfigService,
    private appEnvironmentService: AppEnvironmentService
  ) {}

  async createSampleDB(organizationId, manager: EntityManager) {
    const config = {
      name: 'Sample Data Source',
      kind: 'postgresql',
      type: DataSourceTypes.SAMPLE,
      scope: DataSourceScopes.GLOBAL,
      organization_id: organizationId,
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
    ];
    const insertQueryText = `INSERT INTO "data_sources" (${Object.keys(config).join(', ')}) VALUES (${Object.values(
      config
    ).map((_, index) => `$${index + 1}`)}) RETURNING "id", "type", "scope", "created_at", "updated_at"`;
    const insertValues = Object.values(config);

    const dataSourceList = await manager.query(insertQueryText, insertValues);
    const dataSource: DataSource = dataSourceList[0];

    const allEnvs = await this.appEnvironmentService.getAll(organizationId, manager);

    await Promise.all(
      allEnvs?.map(async (env) => {
        const parsedOptions = await this.dataSourceService.parseOptionsForCreate(options);
        const insertQuery = `INSERT INTO "data_source_options" ( environment_id , data_source_id, options ) VALUES ( $1 , $2 , $3)`;
        const values = [env.id, dataSource.id, parsedOptions];

        await manager.query(insertQuery, values);
      })
    );
  }
}
