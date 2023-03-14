import { Injectable, NotFoundException } from "@nestjs/common";
import { ExportTooljetDatabaseDto } from "@dto/export-resources.dto";
import { ImportTooljetDatabaseDto } from "@dto/import-resources.dto";
import { TooljetDbService } from "./tooljet_db.service";
import { EntityManager } from "typeorm";
import { InternalTable } from "src/entities/internal_table.entity";

@Injectable()
export class TooljetDbImportExportService {
  constructor(private readonly tooljetDbService: TooljetDbService,
    private readonly manager: EntityManager,
             ) {}

  async export(organizationId: string, tjDbDto: ExportTooljetDatabaseDto) {
    const internalTable = await this.manager.findOne(InternalTable, {
      where: { organizationId, id: tjDbDto.table_id }
    });

    if (!internalTable) throw new NotFoundException('Internal table not found');

    const columnSchema = await this.tooljetDbService.perform(
      organizationId,
      "view_table",
      {
        id: tjDbDto.table_id,
      }
    );

    return {
      table_name: internalTable.tableName,
      schema: { columns: columnSchema },
    };
  }

  async import(organizationId: string, tjDbDto: ImportTooljetDatabaseDto) {
    return await this.tooljetDbService.perform(organizationId, "create_table", {
      table_name: tjDbDto.table_name,
      ...tjDbDto.schema,
    });
  }
}
