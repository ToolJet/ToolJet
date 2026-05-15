import {
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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  UseFilters,
  All,
} from '@nestjs/common';

import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { OrganizationAuthGuard } from '@modules/session/guards/organization-auth.guard';
import { TableCountGuard } from '@modules/licensing/guards/table.guard';
import { FeatureAbilityGuard } from './ability/guard';

import { decamelizeKeys } from 'humps';
import { FileInterceptor } from '@nestjs/platform-express';

import { CreatePostgrestTableDto } from './dto';
import { TooljetDbJoinDto } from '@modules/tooljet-db/dto/join.dto';

import { TooljetDbJoinExceptionFilter } from '@modules/tooljet-db/filters/tooljetdb-join-exceptions-filter';
import { TooljetDbExceptionFilter } from '@modules/tooljet-db/filters/tooljetdb-exception-filter';

import { PostgrestProxyService } from './services/postgrest-proxy.service';
import { TooljetDbBulkUploadService } from './services/tooljet-db-bulk-upload.service';
import { TooljetDbTableOperationsService } from './services/tooljet-db-table-operations.service';

import { InitModule } from '@modules/app/decorators/init-module';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from './constants';

@Controller('tooljet-db')
@UseFilters(TooljetDbExceptionFilter)
@InitModule(MODULES.TOOLJET_DATABASE)
export class TooljetDbController {
  protected MAX_CSV_FILE_SIZE = 5 * 1024 * 1024;

  constructor(
    protected readonly tableOperationsService: TooljetDbTableOperationsService,
    protected readonly postgrestProxyService: PostgrestProxyService,
    protected readonly bulkUploadService: TooljetDbBulkUploadService,
  ) {}

  // =========================
  // PROXY (SECURE)
  // =========================
  @InitFeature(FEATURE_KEY.PROXY_POSTGREST)
  @All('/proxy/*')
  @UseGuards(JwtAuthGuard, OrganizationAuthGuard, FeatureAbilityGuard)
  async proxy(@Req() req: any, @Res() res: any, @Next() next: any) {
    if (!req.user) {
      throw new UnauthorizedException('Login required');
    }

    if (!req.user.organizationId) {
      throw new ForbiddenException('Organization missing');
    }

    return this.postgrestProxyService.proxy(req, res, next);
  }

  // =========================
  // VIEW TABLES
  // =========================
  @InitFeature(FEATURE_KEY.VIEW_TABLES)
  @Get('/organizations/:organizationId/tables')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async tables(@Req() req: any, @Param('organizationId') organizationId: string) {
    if (!req.user) throw new UnauthorizedException();

    if (req.user.organizationId !== organizationId) {
      throw new ForbiddenException();
    }

    const result = await this.tableOperationsService.perform(
      organizationId,
      'view_tables',
    );

    return decamelizeKeys({ result });
  }

  // =========================
  // SINGLE TABLE
  // =========================
  @InitFeature(FEATURE_KEY.VIEW_TABLE)
  @Get('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async table(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('tableName') tableName: string,
  ) {
    if (!req.user) throw new UnauthorizedException();

    if (req.user.organizationId !== organizationId) {
      throw new ForbiddenException();
    }

    const result = await this.tableOperationsService.perform(
      organizationId,
      'view_table',
      { table_name: tableName },
    );

    const decamelized = decamelizeKeys({ result }) as Record<string, any>;
    decamelized['result']['configurations'] = result.configurations || {};
    return decamelized;
  }

  // =========================
  // CREATE TABLE
  // =========================
  @InitFeature(FEATURE_KEY.CREATE_TABLE)
  @Post('/organizations/:organizationId/table')
  @UseGuards(JwtAuthGuard, TableCountGuard, FeatureAbilityGuard)
  async createTable(
    @Req() req: any,
    @Body() dto: CreatePostgrestTableDto,
    @Param('organizationId') organizationId: string,
  ) {
    if (!req.user) throw new UnauthorizedException();

    if (req.user.organizationId !== organizationId) {
      throw new ForbiddenException();
    }

    const result = await this.tableOperationsService.perform(
      organizationId,
      'create_table',
      dto,
    );

    return decamelizeKeys({ result });
  }

  // =========================
  // DROP TABLE
  // =========================
  @InitFeature(FEATURE_KEY.DROP_TABLE)
  @Delete('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  async dropTable(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('tableName') tableName: string,
  ) {
    if (!req.user) throw new UnauthorizedException();

    if (req.user.organizationId !== organizationId) {
      throw new ForbiddenException();
    }

    const result = await this.tableOperationsService.perform(
      organizationId,
      'drop_table',
      { table_name: tableName },
    );

    return decamelizeKeys({ result });
  }

  // =========================
  // BULK UPLOAD
  // =========================
  @InitFeature(FEATURE_KEY.BULK_UPLOAD)
  @UseInterceptors(FileInterceptor('file'))
  @Post('/organizations/:organizationId/table/:tableName/bulk-upload')
  async bulkUpload(
    @Req() req: any,
    @Param('organizationId') organizationId: string,
    @Param('tableName') tableName: string,
    @UploadedFile() file: any,
  ) {
    if (!req.user) throw new UnauthorizedException();

    if (req.user.organizationId !== organizationId) {
      throw new ForbiddenException();
    }

    if (file?.size > this.MAX_CSV_FILE_SIZE) {
      throw new BadRequestException('File too large');
    }

    const result = await this.bulkUploadService.perform(
      organizationId,
      tableName,
      file?.buffer,
    );

    return decamelizeKeys({ result });
  }

  // =========================
  // JOIN TABLES (CRITICAL FIX)
  // =========================
  @InitFeature(FEATURE_KEY.JOIN_TABLES)
  @Post('/organizations/:organizationId/join')
  @UseFilters(new TooljetDbJoinExceptionFilter())
  @UseGuards(JwtAuthGuard, OrganizationAuthGuard, FeatureAbilityGuard)
  async joinTables(
    @Req() req: any,
    @Body() dto: TooljetDbJoinDto,
    @Param('organizationId') organizationId: string,
  ) {
    if (!req.user) throw new UnauthorizedException();

    if (req.user.organizationId !== organizationId) {
      throw new ForbiddenException('Invalid organization access');
    }

    const result = await this.tableOperationsService.perform(
      organizationId,
      'join_tables',
      {
        joinQueryJson: { ...dto },
        dataQuery: req.dataQuery,
        user: req.user,
      },
    );

    return decamelizeKeys({ result });
  }
}