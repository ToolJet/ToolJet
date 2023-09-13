import { All, Controller, Req, Res, Next, UseGuards, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { ActiveWorkspaceGuard } from 'src/modules/auth/active-workspace.guard';
import { TableCountGuard } from '@ee/licensing/guards/table.guard';
import { TooljetDbService } from '@services/tooljet_db.service';
import { decamelizeKeys } from 'humps';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';

import { Action, TooljetDbAbility } from 'src/modules/casl/abilities/tooljet-db-ability.factory';
import { TooljetDbGuard } from 'src/modules/casl/tooljet-db.guard';
import { CreatePostgrestTableDto, RenamePostgrestTableDto, PostgrestTableColumnDto } from '@dto/tooljet-db.dto';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';

@Controller('tooljet_db')
export class TooljetDbController {
  constructor(
    private readonly tooljetDbService: TooljetDbService,
    private readonly postgrestProxyService: PostgrestProxyService
  ) {}

  @All('/proxy/*')
  @UseGuards(OrganizationAuthGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ProxyPostgrest, 'all'))
  async proxy(@Req() req, @Res() res, @Next() next) {
    return this.postgrestProxyService.perform(req, res, next);
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
    return decamelizeKeys({ result });
  }

  @Post('/organizations/:organizationId/table')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard, TableCountGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.CreateTable, 'all'))
  async createTable(@Body() createTableDto: CreatePostgrestTableDto, @Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'create_table', createTableDto);
    return decamelizeKeys({ result });
  }

  @Patch('/organizations/:organizationId/table/:tableName')
  @UseGuards(JwtAuthGuard, ActiveWorkspaceGuard, TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.RenameTable, 'all'))
  async renameTable(@Body() renameTableDto: RenamePostgrestTableDto, @Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'rename_table', renameTableDto);
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
    @Body('column') columnDto: PostgrestTableColumnDto,
    @Param('organizationId') organizationId,
    @Param('tableName') tableName
  ) {
    const params = {
      table_name: tableName,
      column: columnDto,
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
}
