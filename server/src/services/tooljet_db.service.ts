import { BadRequestException, Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { EntityManager } from 'typeorm';
import { DataSourcesService } from './data_sources.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { DataQueriesService } from './data_queries.service';

@Injectable()
export class TooljetDbService {
  constructor(
    private readonly dataSourcesService: DataSourcesService,
    private readonly dataQueriesService: DataQueriesService,
    private readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    private tooljetDbManager: EntityManager
  ) {}

  async perform(user: User, organizationId: string, action: string, params = {}) {
    await this.validateUserActiveOnWorkspace(user, organizationId);
    const tooljetDb = await this.findOrFailTooljetDbOnWorkspace(user, organizationId);

    return await this.performAction(user, tooljetDb, action, params);
  }

  private async validateUserActiveOnWorkspace(user: User, organizationId: string) {
    const organization = await this.manager.find(OrganizationUser, {
      where: { userId: user.id, organizationId, status: 'active' },
      select: ['id'],
    });

    if (isEmpty(organization)) {
      throw new BadRequestException('Organization not found');
    }
  }

  private async findOrFailTooljetDbOnWorkspace(user: User, organizationId: string): Promise<DataSource> {
    const tooljetDb = await this.dataSourcesService.findTooljetDb(organizationId);

    if (isEmpty(tooljetDb)) {
      throw new BadRequestException('ToolJetDb not found');
    }

    return tooljetDb;
  }

  private async performAction(user: User, tooljetDb: DataSource, action: string, params: any) {
    switch (action) {
      case 'view_tables':
        return await this.viewTables(tooljetDb);
      case 'create_table':
        return await this.createTable(user, tooljetDb, params);
      case 'add_column':
        return await this.addColumn(user, tooljetDb, params);
      default:
        throw new BadRequestException('Action not defined');
    }
  }

  private async viewTables(tooljetDb: DataSource) {
    return await this.tooljetDbManager.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${tooljetDb.options['schema_name']['value']}';`
    );
  }

  private async createTable(user: User, tooljetDb: DataSource, params) {
    const {
      table_name,
      columns: [column, ...restColumns],
    } = params;
    const createTableString = `CREATE TABLE ${table_name} `;
    let columnDefinitionString = `${column['column_name']} ${column['data_type']}`;

    if (!restColumns)
      return await this.runQueryOnTooljetDb(user, tooljetDb, createTableString + '(' + columnDefinitionString + ');');

    for (const col of restColumns) {
      columnDefinitionString += `, ${col['column_name']} ${col['data_type']}`;
    }

    return await this.runQueryOnTooljetDb(user, tooljetDb, createTableString + '(' + columnDefinitionString + ');');
  }

  private async runQueryOnTooljetDb(user: User, tooljetDb: DataSource, query: string) {
    const dataQueryEntity = {
      data_source_id: tooljetDb.id,
      kind: 'tooljetdb',
      options: {
        mode: 'sql',
        query,
      },
      dataSource: tooljetDb,
    };

    return await this.dataQueriesService.runQuery(user, dataQueryEntity, {});
  }

  private async addColumn(user: User, tooljetDb: DataSource, params) {
    const { table_name, column } = params;

    return await this.runQueryOnTooljetDb(
      user,
      tooljetDb,
      `ALTER TABLE ${table_name} ADD ${column['column_name']} ${column['data_type']};`
    );
  }
}
