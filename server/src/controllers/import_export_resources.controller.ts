import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Body,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../src/modules/auth/jwt-auth.guard";
import { User } from "src/decorators/user.decorator";
import { ExportResourcesDto } from "@dto/export-resources.dto";
import { ImportResourcesDto } from "@dto/import-resources.dto";
import { ImportExportResourcesService } from "@services/import_export_resources.service";

@Controller({
  path: "resources",
  version: '2'
})
export class ImportExportResourcesController {
  constructor(
    private importExportResourcesService: ImportExportResourcesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("/export")
  async export(@User() user, @Body() exportResourcesDto: ExportResourcesDto) {
    const result = await this.importExportResourcesService.export(
      user,
      exportResourcesDto
    );
    return {
      ...result,
      tooljet_version: globalThis.TOOLJET_VERSION,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("/import")
  async import(@User() user, @Body() importResourcesDto: ImportResourcesDto) {
    console.log({importResourcesDto})
    await this.importExportResourcesService.import(user, importResourcesDto);
    return { success: true };
  }
}
