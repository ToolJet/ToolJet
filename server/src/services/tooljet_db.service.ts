import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';
import { User } from 'src/entities/user.entity';

@Injectable()
export class TooljetDbService {
  constructor(
    private readonly manager: EntityManager,
    @InjectEntityManager('tooljetDb')
    private tooljetDbManager: EntityManager
  ) {}

  async perform(user: User, organizationId: string, action: string, params = {}) {
    switch (action) {
      case 'view_tables':
        return await this.viewTables(organizationId);
      case 'create_table':
        return await this.createTable(organizationId, params);
      case 'add_column':
        return await this.addColumn(organizationId, params);
      default:
        throw new BadRequestException('Action not defined');
    }
  }

  private async viewTables(organizationId: string) {
    return await this.manager.find(InternalTable, {
      where: { organizationId },
      select: ['tableName'],
      order: { tableName: 'ASC' },
    });
  }

  private async createTable(organizationId: string, params) {
    const {
      table_name: tableName,
      columns: [column, ...restColumns],
    } = params;
    const queryRunner = this.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const internalTable = queryRunner.manager.create(InternalTable, {
        tableName,
        organizationId,
      });
      await queryRunner.manager.save(internalTable);

      const createTableString = `CREATE TABLE "${internalTable.id}" `;
      let columnDefinitionString = `${column['column_name']} ${column['data_type']}`;

      if (restColumns)
        for (const col of restColumns) {
          columnDefinitionString += `, ${col['column_name']} ${col['data_type']}`;
        }

      // if tooljetdb query fails in this connection, we must rollback internal table
      // created in the other connection
      await this.tooljetDbManager.query(createTableString + '(' + columnDefinitionString + ');');

      await queryRunner.commitTransaction();
      return true;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async addColumn(organizationId: string, params) {
    const { table_name: tableName, column } = params;
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, tableName },
    });
    if (!internalTable) {
      throw new NotFoundException('Internal table not found: ' + tableName);
    }

    return await this.tooljetDbManager.query(
      `ALTER TABLE "${internalTable.id}" ADD ${column['column_name']} ${column['data_type']};`
    );
  }
}
