import {
  Controller,
  ForbiddenException,
  Get,
  Body,
  Param,
  Post,
  Delete,
  Put,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { GlobalDataSourceAbilityFactory } from 'src/modules/casl/abilities/global-datasource-ability.factory';
import { DataSourcesService } from '@services/data_sources.service';
import { CreateDataSourceDto, UpdateDataSourceDto } from '@dto/data-source.dto';
import { decode } from 'js-base64';
import { User } from 'src/decorators/user.decorator';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceScopes } from 'src/helpers/data_source.constants';

@Controller({
  path: 'data_sources',
  version: '2',
})
export class GlobalDataSourcesController {
  constructor(
    private globalDataSourceAbilityFactory: GlobalDataSourceAbilityFactory,
    private dataSourcesService: DataSourcesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async fetchGlobalDataSources(@User() user, @Query() query) {
    const dataSources = await this.dataSourcesService.all(query, user.organizationId, DataSourceScopes.GLOBAL);
    for (const dataSource of dataSources) {
      if (dataSource.pluginId) {
        dataSource.plugin.iconFile.data = dataSource.plugin.iconFile.data.toString('utf8');
        dataSource.plugin.manifestFile.data = JSON.parse(decode(dataSource.plugin.manifestFile.data.toString('utf8')));
        dataSource.plugin.operationsFile.data = JSON.parse(
          decode(dataSource.plugin.operationsFile.data.toString('utf8'))
        );
      }
    }
    return decamelizeKeys({ data_sources: dataSources }, function (key, convert, options) {
      const checkForKeysAsPath = /^(\/{0,1}(?!\/))[A-Za-z0-9/\-_]+(.([a-zA-Z]+))?$/gm;
      return checkForKeysAsPath.test(key) ? key : convert(key, options);
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGlobalDataSources(@User() user, @Body() createDataSourceDto: CreateDataSourceDto) {
    const { kind, name, options, app_version_id: appVersionId, plugin_id: pluginId, scope } = createDataSourceDto;

    const ability = await this.globalDataSourceAbilityFactory.globalDataSourceActions(user);

    if (!ability.can('createGlobalDataSource', DataSource)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const dataSource = await this.dataSourcesService.create(
      name,
      kind,
      options,
      appVersionId,
      user.organizationId,
      scope,
      pluginId
    );

    return decamelizeKeys(dataSource);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @User() user,
    @Param('id') dataSourceId,
    @Query('environment_id') environmentId,
    @Body() updateDataSourceDto: UpdateDataSourceDto
  ) {
    const ability = await this.globalDataSourceAbilityFactory.globalDataSourceActions(user);

    if (!ability.can('updateGlobalDataSource', DataSource)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { name, options } = updateDataSourceDto;

    await this.dataSourcesService.update(dataSourceId, user.organizationId, name, options, environmentId);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') dataSourceId) {
    const ability = await this.globalDataSourceAbilityFactory.globalDataSourceActions(user);

    if (!ability.can('deleteGlobalDataSource', DataSource)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    const result = await this.dataSourcesService.delete(dataSourceId);
    if (result.affected == 1) {
      return;
    } else {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/scope')
  async convertToGlobal(@User() user, @Param('id') dataSourceId) {
    const ability = await this.globalDataSourceAbilityFactory.globalDataSourceActions(user);

    if (!ability.can('updateGlobalDataSource', DataSource)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    await this.dataSourcesService.convertToGlobalSource(dataSourceId, user.organizationId);
    return;
  }
}
