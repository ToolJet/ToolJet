import { Injectable, NotFoundException } from '@nestjs/common';
import { ExportTooljetDatabaseDto } from '@dto/export-resources.dto';
import { ImportTooljetDatabaseDto } from '@dto/import-resources.dto';
import { TooljetDbService } from './tooljet_db.service';
import { EntityManager } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';

@Injectable()
export class TooljetDbImportExportService {
  constructor(private readonly tooljetDbService: TooljetDbService, private readonly manager: EntityManager) {}

  async export(organizationId: string, tjDbDto: ExportTooljetDatabaseDto) {
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, id: tjDbDto.table_id },
    });

    if (!internalTable) throw new NotFoundException('Tooljet database table not found');

    const columnSchema = await this.tooljetDbService.perform(organizationId, 'view_table', {
      id: tjDbDto.table_id,
    });

    return {
      id: internalTable.id,
      table_name: internalTable.tableName,
      schema: { columns: columnSchema },
    };
  }

  async import(organizationId: string, tjDbDto: ImportTooljetDatabaseDto, cloning = false) {
    const internalTableWithSameNameExists = await this.manager.findOne(InternalTable, {
      where: {
        tableName: tjDbDto.table_name,
        organizationId,
      },
    });

    if (
      cloning &&
      internalTableWithSameNameExists &&
      (await this.isTableColumnsSubset(internalTableWithSameNameExists, tjDbDto))
    )
      return { id: internalTableWithSameNameExists.id, name: internalTableWithSameNameExists.tableName };

    const tableName = internalTableWithSameNameExists
      ? `${tjDbDto.table_name}_${new Date().getTime()}`
      : tjDbDto.table_name;

    return await this.tooljetDbService.perform(organizationId, 'create_table', {
      table_name: tableName,
      ...tjDbDto.schema,
    });
  }

  async isTableColumnsSubset(internalTable: InternalTable, tjDbDto: ImportTooljetDatabaseDto): Promise<boolean> {
    const dtoColumns = new Set<string>(tjDbDto.schema.columns.map((c) => c.column_name));

    const internalTableColumnSchema = await this.tooljetDbService.perform(internalTable.organizationId, 'view_table', {
      id: internalTable.id,
    });
    const internalTableColumns = new Set<string>(internalTableColumnSchema.map((c) => c.column_name));
    const isSubset = (subset: Set<string>, superset: Set<string>) => [...subset].every((item) => superset.has(item));

    return isSubset(dtoColumns, internalTableColumns);
  }
}
