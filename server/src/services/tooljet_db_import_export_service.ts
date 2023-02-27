import { Injectable } from "@nestjs/common";
import { ExportTooljetDatabaseDto } from "@dto/export-resources.dto";
import { ImportTooljetDatabaseDto } from "@dto/import-resources.dto";
import { TooljetDbService } from "./tooljet_db.service";

@Injectable()
export class TooljetDbImportExportService {
  constructor(private readonly tooljetDbService: TooljetDbService) {}

  async export(organizationId: string, tjDbDto: ExportTooljetDatabaseDto) {
    const columnSchema = await this.tooljetDbService.perform(
      organizationId,
      "view_table",
      {
        table_name: tjDbDto.table_name,
      }
    );

    return {
      table_name: tjDbDto.table_name,
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
