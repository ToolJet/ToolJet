import { All, Controller, Req, Res, Next, UseGuards, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { ActiveWorkspaceGuard } from 'src/modules/auth/active-workspace.guard';
import { TooljetDbService } from '@services/tooljet_db.service';
import { decamelizeKeys } from 'humps';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { CheckPolicies } from 'src/modules/casl/check_policies.decorator';

import { Action, TooljetDbAbility } from 'src/modules/casl/abilities/tooljet-db-ability.factory';
import { TooljetDbGuard } from 'src/modules/casl/tooljet-db.guard';
import { CreatePostgrestTableDto, RenamePostgrestTableDto, PostgrestTableColumnDto } from '@dto/tooljet-db.dto';

@Controller('tooljet_db/organizations')
@UseGuards(JwtAuthGuard, ActiveWorkspaceGuard)
export class TooljetDbController {
  constructor(
    private readonly tooljetDbService: TooljetDbService,
    private readonly postgrestProxyService: PostgrestProxyService
  ) {}

  @All('/:organizationId/proxy/*')
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ProxyPostgrest, 'all'))
  async proxy(@Req() req, @Res() res, @Next() next, @Param('organizationId') organizationId) {
    return this.postgrestProxyService.perform(req, res, next, organizationId);
  }

  @Get('/:organizationId/tables')
  @UseGuards(TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ViewTables, 'all'))
  async tables(@Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'view_tables');
    return decamelizeKeys({ result });
  }

  @Get('/:organizationId/table/:tableName')
  @UseGuards(TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.ViewTable, 'all'))
  async table(@Body() body, @Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tooljetDbService.perform(organizationId, 'view_table', { table_name: tableName });
    return decamelizeKeys({ result });
  }

  @Post('/:organizationId/table')
  @UseGuards(TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.CreateTable, 'all'))
  async createTable(@Body() createTableDto: CreatePostgrestTableDto, @Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'create_table', createTableDto);
    return decamelizeKeys({ result });
  }

  @Patch('/:organizationId/table/:tableName')
  @UseGuards(TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.RenameTable, 'all'))
  async renameTable(@Body() renameTableDto: RenamePostgrestTableDto, @Param('organizationId') organizationId) {
    const result = await this.tooljetDbService.perform(organizationId, 'rename_table', renameTableDto);
    return decamelizeKeys({ result });
  }

  @Delete('/:organizationId/table/:tableName')
  @UseGuards(TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.DropTable, 'all'))
  async dropTable(@Param('organizationId') organizationId, @Param('tableName') tableName) {
    const result = await this.tooljetDbService.perform(organizationId, 'drop_table', { table_name: tableName });
    return decamelizeKeys({ result });
  }

  @Post('/:organizationId/table/:tableName/column')
  @UseGuards(TooljetDbGuard)
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

  @Delete('/:organizationId/table/:tableName/column/:columnName')
  @UseGuards(TooljetDbGuard)
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

  @Post('/:organizationId/getDetailsOnJoin')
  @UseGuards(TooljetDbGuard)
  @CheckPolicies((ability: TooljetDbAbility) => ability.can(Action.JoinTables, 'all'))
  async getDetailsOnJoin(@Body() joinQueryJsonDto: any, @Param('organizationId') organizationId) {
    // Gathering tables used, from Join coditions
    const tableSet = new Set();
    const joinOptions = joinQueryJsonDto?.['joins'];
    (joinOptions || []).forEach((join) => {
      const { table, conditions } = join;
      tableSet.add(table);
      conditions?.conditionsList?.forEach((condition) => {
        const { leftField, rightField } = condition;
        if (leftField?.table) {
          tableSet.add(leftField?.table);
        }
        if (rightField?.table) {
          tableSet.add(rightField?.table);
        }
      });
    });

    const tables = [...tableSet].map((table) => ({
      name: table,
      type: 'Table',
    }));

    const params = {
      joinQueryJson: { ...joinQueryJsonDto, tables: tables },
    };

    const result = await this.tooljetDbService.perform(organizationId, 'join_tables', params);
    return decamelizeKeys({ result });
  }
}
