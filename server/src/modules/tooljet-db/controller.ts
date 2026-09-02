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
  Query,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseFilters,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { TableCountGuard } from '@modules/licensing/guards/table.guard';
import { decamelizeKeys } from 'humps';

import { CreatePostgrestTableDto, EditTableDto, EditColumnTableDto, PostgrestForeignKeyDto, AddColumnDto } from './dto';
import { PromoteTableDto } from './dto/promote.dto';
import { RawSqlMigrationDto } from './dto/raw-sql-migration.dto';
import { RevertMigrationDto } from './dto/revert-migration.dto';
import { TooljetDbPromoteService } from './services/tooljet-db-promote.service';
import { TooljetDbEnvironmentAssignmentService } from './services/tooljet-db-environment-assignment.service';
import { TooljetDbRawSqlMigrationService } from './services/tooljet-db-raw-sql-migration.service';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from '@entities/user.entity';
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
    protected readonly promoteService: TooljetDbPromoteService,
    protected readonly environmentAssignmentService: TooljetDbEnvironmentAssignmentService,
    protected readonly rawSqlMigrationService: TooljetDbRawSqlMigrationService,
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
    const result = await this.tableOperationsService.perform(organizationId, 'view_tables', {}, undefined);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.VIEW_TABLES)
  @Get('/tables/limits/:organizationId')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async getTablesLimit(@Param('organizationId') organizationId) {
    const data = await this.tableOperationsService.getTablesLimit(organizationId);
    return data;
  }

  @InitFeature(FEATURE_KEY.VIEW_TABLE)
  @Get('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async table(@Body() body, @Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tableOperationsService.perform(
      organizationId,
      'view_table',
      { table_name: tableName },
      undefined
    );
    const decamelizedResult = decamelizeKeys({ result });
    decamelizedResult['result']['configurations'] = result.configurations || {};
    return decamelizedResult;
  }

  @InitFeature(FEATURE_KEY.CREATE_TABLE)
  @Post('/organizations/:organizationId/table')
  @UseGuards(JwtAuthGuard, TableCountGuard, FeatureAbilityGuard)
  async createTable(@Body() createTableDto: CreatePostgrestTableDto, @Param('organizationId') organizationId) {
    const result = await this.tableOperationsService.perform(organizationId, 'create_table', createTableDto, undefined);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.RENAME_TABLE)
  @Patch('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async editTable(@Body() editTableBody: EditTableDto, @Param('organizationId') organizationId) {
    const result = await this.tableOperationsService.perform(organizationId, 'edit_table', editTableBody, undefined);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.DROP_TABLE)
  @Delete('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async dropTable(@Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tableOperationsService.perform(
      organizationId,
      'drop_table',
      { table_name: tableName },
      undefined
    );
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
    const result = await this.tableOperationsService.perform(organizationId, 'add_column', params, undefined);
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

    const result = await this.tableOperationsService.perform(organizationId, 'drop_column', params, undefined);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.BULK_UPLOAD)
  @UseInterceptors(FileInterceptor('file'))
  @Post('/organizations/:organizationId/table/:tableName/bulk-upload')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
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

    const result = await this.tableOperationsService.perform(organizationId, 'join_tables', params, undefined);
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
    const result = await this.tableOperationsService.perform(organizationId, 'edit_column', params, undefined);
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
    const result = await this.tableOperationsService.perform(organizationId, 'create_foreign_key', params, undefined);
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
    const result = await this.tableOperationsService.perform(organizationId, 'update_foreign_key', params, undefined);
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
    const result = await this.tableOperationsService.perform(organizationId, 'delete_foreign_key', params, undefined);
    return decamelizeKeys({ result });
  }

  // Keys on :tableId, not :tableName like its neighbours — promote is an identity operation and a
  // display name is not one.
  @InitFeature(FEATURE_KEY.PROMOTE_TABLE)
  @Post('/organizations/:organizationId/table/:tableId/promote')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async promoteTable(
    @User() user: UserEntity,
    @Param('organizationId') organizationId: string,
    @Param('tableId') tableId: string,
    @Body() promoteTableDto: PromoteTableDto
  ) {
    const result = await this.promoteService.promote(user, organizationId, tableId, promoteTableDto.environment_id);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.PROMOTE_TABLE_PREVIEW)
  @Get('/organizations/:organizationId/table/:tableId/promote/preview')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async previewPromoteTable(
    @User() user: UserEntity,
    @Param('organizationId') organizationId: string,
    @Param('tableId') tableId: string,
    @Query('environment_id', new ParseUUIDPipe()) environmentId: string
  ) {
    const result = await this.promoteService.previewPromote(user, organizationId, tableId, environmentId);
    return decamelizeKeys({ result });
  }

  // No licence gate here — repair is real logic in CE, not a promotion.
  @InitFeature(FEATURE_KEY.REPAIR_BASELINE)
  @Post('/organizations/:organizationId/table/:tableId/baseline/repair')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async repairBaseline(@Param('organizationId') organizationId: string, @Param('tableId') tableId: string) {
    const result = await this.environmentAssignmentService.repairBaseline(tableId, organizationId);
    return decamelizeKeys({ result });
  }

  // Keys on :tableId, not :tableName like its neighbours, same reason promote does — this is an
  // identity operation, not a display-name one.
  @InitFeature(FEATURE_KEY.ADD_RAW_SQL_MIGRATION)
  @Post('/organizations/:organizationId/table/:tableId/migrations/sql')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async recordRawSqlMigration(
    @Param('organizationId') organizationId: string,
    @Param('tableId') tableId: string,
    @Body() rawSqlMigrationDto: RawSqlMigrationDto
  ) {
    const result = await this.rawSqlMigrationService.recordRawSqlMigration(organizationId, tableId, rawSqlMigrationDto);
    return decamelizeKeys({ result });
  }

  @InitFeature(FEATURE_KEY.REVERT_MIGRATION)
  @Post('/organizations/:organizationId/table/:tableId/migrations/:migrationId/revert')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async revertMigration(
    @Param('organizationId') organizationId: string,
    @Param('tableId') tableId: string,
    @Param('migrationId') migrationId: string,
    @Body() revertMigrationDto: RevertMigrationDto
  ) {
    const result = await this.rawSqlMigrationService.revert(organizationId, tableId, migrationId, revertMigrationDto);
    return decamelizeKeys({ result });
  }
}
