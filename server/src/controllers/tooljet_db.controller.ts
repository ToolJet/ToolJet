import {
  All,
  Controller,
  Req,
  Res,
  Next,
  UseGuards,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseFilters,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { ActiveWorkspaceGuard } from 'src/modules/auth/active-workspace.guard';
import { TooljetDbService } from '@services/tooljet_db.service';
import { decamelizeKeys } from 'humps';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';

import { Action, TooljetDbAbility } from 'src/modules/casl/abilities/tooljet-db-ability.factory';
import { TooljetDbGuard } from 'src/modules/casl/tooljet-db.guard';
import {
  CreatePostgrestTableDto,
  EditTableDto,
  EditColumnTableDto,
  PostgrestForeignKeyDto,
  AddColumnDto,
} from '@dto/tooljet-db.dto';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { TooljetDbBulkUploadService } from '@services/tooljet_db_bulk_upload.service';
import { TooljetDbJoinDto } from '@dto/tooljet-db-join.dto';
import { TooljetDbJoinExceptionFilter } from 'src/filters/tooljetdb-join-exceptions-filter';
import { Logger } from 'nestjs-pino';
import { TooljetDbExceptionFilter } from 'src/filters/tooljetdb-exception-filter';

@Controller('tooljet-db')
@UseFilters(TooljetDbExceptionFilter)
export class TooljetDbController {
  private readonly pinoLogger: Logger;
  private MAX_CSV_FILE_SIZE;

  constructor(
    private readonly tooljetDbService: TooljetDbService,
    private readonly postgrestProxyService: PostgrestProxyService,
    private readonly tooljetDbBulkUploadService: TooljetDbBulkUploadService,
    private readonly logger: Logger
  ) {
    this.pinoLogger = logger;
    this.MAX_CSV_FILE_SIZE =
      process.env?.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB &&
      !isNaN(Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB))
        ? 1024 * 1024 * Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB)
        : 1024 * 1024 * 5; // 5MB
  }

  @All('/proxy/*')
  @UseGuards(OrganizationAuthGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ProxyPostgrest, 'all'))
  async proxy(@Req() req, @Res() res, @Next() next) {
    return this.postgrestProxyService.proxy(req, res, next);
  }

  @Get('/organizations/:organizationId/tables')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ViewTables, 'all'))
  async tables(@Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'view_tables');
    return decamelizeKeys({ result });
  }

  @Get('/tables/limits')
  @UseGuards(TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ViewTables, 'all'))
  async getTablesLimit(@Param('organizationId') organizationId) {
    const data = await this.tooljetDbService.getTablesLimit();
    return data;
  }

  @Get('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ViewTable, 'all'))
  async table(@Body() body, @Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tooljetDbService.perform(organizationId, 'view_table', { table_name: tableName });
    const decamelizedResult = decamelizeKeys({ result });
    decamelizedResult['result']['configurations'] = result.configurations || {};
    return decamelizedResult;
  }

  @Post('/organizations/:organizationId/table')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.CreateTable, 'all'))
  async createTable(@Body() createTableDto: CreatePostgrestTableDto, @Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'create_table', createTableDto);
    return decamelizeKeys({ result });
  }

  @Patch('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.RenameTable, 'all'))
  async editTable(@Body() editTableBody: EditTableDto, @Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'edit_table', editTableBody);
    return decamelizeKeys({ result });
  }

  @Delete('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.DropTable, 'all'))
  async dropTable(@Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tooljetDbService.perform(organizationId, 'drop_table', { table_name: tableName });
    return decamelizeKeys({ result });
  }

  @Post('/organizations/:organizationId/table/:tableName/column')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.AddColumn, 'all'))
  async addColumn(
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Body() addColumnBody: AddColumnDto
  ) {
    const params = {
      table_name: tableName,
      column: addColumnBody.column,
      foreign_keys: addColumnBody?.foreign_keys || [],
    };
    const result = await this.tooljetDbService.perform(organizationId, 'add_column', params);
    return decamelizeKeys({ result });
  }

  @Delete('/organizations/:organizationId/table/:tableName/column/:columnName')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.DropColumn, 'all'))
  async dropColumn(
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Param('columnName') columnName
  ) {
    const params = {
      table_name: tableName,
      column: { column_name: columnName },
    };

    const result = await this.tooljetDbService.perform(organizationId, 'drop_column', params);
    return decamelizeKeys({ result });
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/organizations/:organizationId/table/:tableName/bulk-upload')
  async bulkUpload(@Param('organizationId') organizationId, @Param('tableName') tableName, @UploadedFile() file: any) {
    if (file?.size > this.MAX_CSV_FILE_SIZE) {
      throw new BadRequestException(`File size cannot be greater than ${this.MAX_CSV_FILE_SIZE / (1024 * 1024)}MB`);
    }
    const result = await this.tooljetDbBulkUploadService.perform(organizationId, tableName, file?.buffer);

    return decamelizeKeys({ result });
  }

  @Post('/organizations/:organizationId/join')
  @UseFilters(new TooljetDbJoinExceptionFilter())
  @UseGuards(OrganizationAuthGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.JoinTables, 'all'))
  async joinTables(@Req() req, @Body() tooljetDbJoinDto: TooljetDbJoinDto, @Param('organizationId') organizationId) {
    const params = {
      joinQueryJson: { ...tooljetDbJoinDto },
      dataQuery: req.dataQuery,
      user: req.user,
    };

    const result = await this.tooljetDbService.perform(organizationId, 'join_tables', params);
    return decamelizeKeys({ result });
  }
  @Patch('/organizations/:organizationId/table/:tableName/column')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.EditColumn, 'all'))
  async editColumn(
    @Body('column') columnDto: EditColumnTableDto,
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Body('foreignKeyIdToDelete') foreignKeyIdToDelete?: string
  ) {
    const params = {
      table_name: tableName,
      column: columnDto,
      foreign_key_id_to_delete: foreignKeyIdToDelete || '',
    };
    const result = await this.tooljetDbService.perform(organizationId, 'edit_column', params);
    return decamelizeKeys({ result });
  }

  @Post('/organizations/:organizationId/table/:tableName/foreignkey')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.AddForeignKey, 'all'))
  async createForeignKey(
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Body('foreign_keys') foreign_keys: Array<PostgrestForeignKeyDto>
  ) {
    const params = {
      table_name: tableName,
      foreign_keys: foreign_keys,
      shouldDestroyDbConnection: true,
    };
    const result = await this.tooljetDbService.perform(organizationId, 'create_foreign_key', params);
    return decamelizeKeys({ result });
  }

  @Put('/organizations/:organizationId/table/:tableName/foreignkey')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.UpdateForeignKey, 'all'))
  async updateForeignKey(
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Body('foreign_key_id') foreign_key_id: string,
    @Body('foreign_keys') foreign_keys: Array<PostgrestForeignKeyDto>
  ) {
    const params = {
      table_name: tableName,
      foreign_key_id: foreign_key_id,
      foreign_keys: foreign_keys,
    };
    const result = await this.tooljetDbService.perform(organizationId, 'update_foreign_key', params);
    return decamelizeKeys({ result });
  }

  @Delete('/organizations/:organizationId/table/:tableName/foreignkey/:foreignKeyId')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.DeleteForeignKey, 'all'))
  async deleteForeignKey(
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Param('foreignKeyId') foreignKeyId: string
  ) {
    const params = {
      table_name: tableName,
      foreign_key_id: foreignKeyId,
    };
    const result = await this.tooljetDbService.perform(organizationId, 'delete_foreign_key', params);
    return decamelizeKeys({ result });
  }
}
