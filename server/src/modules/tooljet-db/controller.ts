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
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { TableCountGuard } from '@modules/licensing/guards/table.guard';
import { decamelizeKeys } from 'humps';

import { CreatePostgrestTableDto, EditTableDto, EditColumnTableDto, PostgrestForeignKeyDto, AddColumnDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { TooljetDbJoinDto } from '@modules/tooljet-db/dto/join.dto';
import { TooljetDbJoinExceptionFilter } from '@modules/tooljet-db/filters/tooljetdb-join-exceptions-filter';
import { Logger } from 'nestjs-pino';
import { TooljetDbExceptionFilter } from '@modules/tooljet-db/filters/tooljetdb-exception-filter';
import { PostgrestProxyService } from './services/postgrest-proxy.service';
import { TooljetDbBulkUploadService } from './services/tooljet-db-bulk-upload.service';
import { OrganizationAuthGuard } from '@modules/session/guards/organization-auth.guard';
import { TooljetDbTableOperationsService } from './services/tooljet-db-table-operations.service';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { FeatureAbilityGuard } from './ability/guard';

@Controller('tooljet-db')
@UseFilters(TooljetDbExceptionFilter)
@InitModule(MODULES.TOOLJET_DATABASE)
export class TooljetDbController {
  protected readonly pinoLogger: Logger;
  protected MAX_CSV_FILE_SIZE;

  constructor(
    protected readonly tableOperationsService: TooljetDbTableOperationsService,
    protected readonly postgrestProxyService: PostgrestProxyService,
    protected readonly bulkUploadService: TooljetDbBulkUploadService,
    protected readonly logger: Logger
  ) {
    this.pinoLogger = logger;
    this.MAX_CSV_FILE_SIZE =
      process.env?.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB &&
      !isNaN(Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB))
        ? 1024 * 1024 * Number(process.env.TOOLJET_DB_BULK_UPLOAD_MAX_CSV_FILE_SIZE_MB)
        : 1024 * 1024 * 5; // 5MB
  }

  @InitFeature(FEATURE_KEY.PROXY_POSTGREST)
  @All('/proxy/*')
  @UseGuards(OrganizationAuthGuard, FeatureAbilityGuard)
  async proxy(@Req() req, @Res() res, @Next() next) {
    return this.postgrestProxyService.proxy(req, res, next);
  }

  @InitFeature(FEATURE_KEY.VIEW_TABLES)
  @Get('/organizations/:organizationId/tables')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async tables(@Param('organizationId') organizationId) {
    const result = await this.tableOperationsService.perform(organizationId, 'view_tables');
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.VIEW_TABLES)
  @Get('/tables/limits')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async getTablesLimit(@Param('organizationId') organizationId) {
    const data = await this.tableOperationsService.getTablesLimit();
    return data;
  }

  @InitFeature(FEATURE_KEY.VIEW_TABLE)
  @Get('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async table(@Body() body, @Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tableOperationsService.perform(organizationId, 'view_table', { table_name: tableName });
    const decamelizedResult = decamelizeKeys({ result });
    decamelizedResult['result']['configurations'] = result.configurations || {};
    return decamelizedResult;
  }

  @InitFeature(FEATURE_KEY.CREATE_TABLE)
  @Post('/organizations/:organizationId/table')
  @UseGuards(JwtAuthGuard, TableCountGuard, FeatureAbilityGuard)
  async createTable(@Body() createTableDto: CreatePostgrestTableDto, @Param('organizationId') organizationId) {
    const result = await this.tableOperationsService.perform(organizationId, 'create_table', createTableDto);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.RENAME_TABLE)
  @Patch('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async editTable(@Body() editTableBody: EditTableDto, @Param('organizationId') organizationId) {
    const result = await this.tableOperationsService.perform(organizationId, 'edit_table', editTableBody);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.DROP_TABLE)
  @Delete('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async dropTable(@Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tableOperationsService.perform(organizationId, 'drop_table', { table_name: tableName });
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.ADD_COLUMN)
  @Post('/organizations/:organizationId/table/:tableName/column')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
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
    const result = await this.tableOperationsService.perform(organizationId, 'add_column', params);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.DROP_COLUMN)
  @Delete('/organizations/:organizationId/table/:tableName/column/:columnName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async dropColumn(
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Param('columnName') columnName
  ) {
    const params = {
      table_name: tableName,
      column: { column_name: columnName },
    };

    const result = await this.tableOperationsService.perform(organizationId, 'drop_column', params);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.BULK_UPLOAD)
  @UseInterceptors(FileInterceptor('file'))
  @Post('/organizations/:organizationId/table/:tableName/bulk-upload')
  async bulkUpload(@Param('organizationId') organizationId, @Param('tableName') tableName, @UploadedFile() file: any) {
    if (file?.size > this.MAX_CSV_FILE_SIZE) {
      throw new BadRequestException(`File size cannot be greater than ${this.MAX_CSV_FILE_SIZE / (1024 * 1024)}MB`);
    }
    const result = await this.bulkUploadService.perform(organizationId, tableName, file?.buffer);

    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.JOIN_TABLES)
  @Post('/organizations/:organizationId/join')
  @UseFilters(new TooljetDbJoinExceptionFilter())
  @UseGuards(OrganizationAuthGuard, FeatureAbilityGuard)
  async joinTables(@Req() req, @Body() tooljetDbJoinDto: TooljetDbJoinDto, @Param('organizationId') organizationId) {
    const params = {
      joinQueryJson: { ...tooljetDbJoinDto },
      dataQuery: req.dataQuery,
      user: req.user,
    };

    const result = await this.tableOperationsService.perform(organizationId, 'join_tables', params);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.EDIT_COLUMN)
  @Patch('/organizations/:organizationId/table/:tableName/column')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
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
    const result = await this.tableOperationsService.perform(organizationId, 'edit_column', params);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.ADD_FOREIGN_KEY)
  @Post('/organizations/:organizationId/table/:tableName/foreignkey')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
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
    const result = await this.tableOperationsService.perform(organizationId, 'create_foreign_key', params);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.UPDATE_FOREIGN_KEY)
  @Put('/organizations/:organizationId/table/:tableName/foreignkey')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
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
    const result = await this.tableOperationsService.perform(organizationId, 'update_foreign_key', params);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.DELETE_FOREIGN_KEY)
  @Delete('/organizations/:organizationId/table/:tableName/foreignkey/:foreignKeyId')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async deleteForeignKey(
    @Param('organizationId') organizationId,
    @Param('tableName') tableName,
    @Param('foreignKeyId') foreignKeyId: string
  ) {
    const params = {
      table_name: tableName,
      foreign_key_id: foreignKeyId,
    };
    const result = await this.tableOperationsService.perform(organizationId, 'delete_foreign_key', params);
    return decamelizeKeys({ result });
  }
}
