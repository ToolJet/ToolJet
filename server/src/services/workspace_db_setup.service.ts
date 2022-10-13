import { CreateDataSourceDto } from '@dto/data-source.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmpty } from 'lodash';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';
import * as crypto from 'crypto';
import { DataSourcesService } from './data_sources.service';
import { DataSource } from 'src/entities/data_source.entity';
import { createTooljetDbConnection } from 'scripts/database-config-utils';

@Injectable()
export class WorkspaceDbSetupService {
  constructor(private readonly configService: ConfigService, private readonly dataSourcesService: DataSourcesService) {}

  async perform(manager: EntityManager, organizationId: string): Promise<DataSource> {
    // validate if db already exists
    await this.validateOrgExists(manager, organizationId);

    return await this.setupTooljetDb(manager, organizationId);
  }

  async validateOrgExists(manager: EntityManager, organizationId: string) {
    const isOrgEmpty = await this.isOrgEmpty(manager, organizationId);
    if (isEmpty(organizationId) || isOrgEmpty) {
      throw new BadRequestException('Organization not found' + ' ' + organizationId);
    }
  }

  async isOrgEmpty(manager: EntityManager, organizationId: string): Promise<boolean> {
    const organization = await manager.findOne(Organization, {
      where: { id: organizationId },
    });
    return !!isEmpty(organization);
  }

  async setupTooljetDb(manager: EntityManager, organizationId: string): Promise<DataSource> {
    const dbUser = `user_${organizationId}`;
    const schemaName = `workspace_${organizationId}`;
    const dbPassword = crypto.randomBytes(8).toString('hex');

    console.log({ dbUser });
    console.log({ dbPassword });

    // We need to establish and run query onto a different database.
    // this needs to be done outside the migration transaction block.
    const tooljetDbConnection = await createTooljetDbConnection();
    await this.createWorkspaceDbUser(dbUser, dbPassword, tooljetDbConnection.manager);
    await this.setupWorkspaceDb(schemaName, dbUser, tooljetDbConnection.manager);
    return await this.addWorkspaceDbToDataSource(dbUser, dbPassword, organizationId, manager);
  }

  async addWorkspaceDbToDataSource(
    dbUser: string,
    dbPassword: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<DataSource> {
    const dto: CreateDataSourceDto = {
      app_id: null,
      app_version_id: null,
      organization_id: organizationId,
      kind: 'tooljetdb',
      name: 'ToolJet DB',
      options: [
        {
          key: 'host',
          value: this.configService.get<string>('PG_HOST'),
        },
        {
          key: 'port',
          value: this.configService.get<string>('PG_PORT') || 5432,
        },
        {
          key: 'database',
          value: this.configService.get<string>('TOOLJET_DB'),
        },
        {
          key: 'username',
          value: dbUser,
        },
        {
          encrypted: true,
          key: 'password',
          value: dbPassword,
        },
        {
          encrypted: false,
          key: 'ssl_enabled',
          value: false,
        },
        {
          encrypted: false,
          key: 'ssl_certificate',
          value: 'none',
        },
      ],
    };

    const workspaceDb = await this.dataSourcesService.create(
      dto.name,
      dto.kind,
      dto.options,
      dto.app_id,
      dto.app_version_id,
      dto.organization_id,
      manager
    );

    return workspaceDb;
  }

  async createWorkspaceDbUser(username: string, password: string, manager: EntityManager): Promise<void> {
    const databaseName = this.configService.get<string>('TOOLJET_DB');
    // We need to restict access to public schema since all tables will be available for non super users
    await manager.query(`REVOKE ALL ON DATABASE "${databaseName}" FROM PUBLIC;`);
    await manager.query(`CREATE ROLE "${username}" WITH LOGIN NOCREATEDB PASSWORD '${password}'`);
    await manager.query(`GRANT CONNECT ON DATABASE "${databaseName}" TO "${username}";`);
  }

  async setupWorkspaceDb(schemaName: string, dbUser: string, manager: EntityManager): Promise<void> {
    await manager.query(`CREATE SCHEMA "${schemaName}" AUTHORIZATION "${dbUser}";`);
    await manager.query(`GRANT USAGE ON SCHEMA "${schemaName}" TO "${dbUser}";`);
    await manager.query(`ALTER USER "${dbUser}" set SEARCH_PATH = "${schemaName}";`);
    // https://postgrest.org/en/stable/configuration.html?highlight=sigusr#in-database-configuration
    await manager.query(`ALTER ROLE "${dbUser}" SET pgrst.db_schemas = "${schemaName}";`);
    // https://postgrest.org/en/stable/configuration.html?highlight=sigusr#reload-with-notify
    await manager.query("NOTIFY pgrst, 'reload config';");
  }
}
