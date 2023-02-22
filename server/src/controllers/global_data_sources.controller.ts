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
import { AppsService } from '@services/apps.service';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { DataQueriesService } from '@services/data_queries.service';
import { GlobalDataSourcesService } from '@services/global_data_sources.service';
import { AuthorizeDataSourceOauthDto, CreateDataSourceDto, UpdateDataSourceDto } from '@dto/data-source.dto';
import { decode } from 'js-base64';
import { User } from 'src/decorators/user.decorator';

@Controller('v2/data_sources')
export class GlobalDataSourcesController {
  constructor(
    private appsService: AppsService,
    private appsAbilityFactory: AppsAbilityFactory,
    private globalDataSourcesService: GlobalDataSourcesService,
    private dataQueriesService: DataQueriesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async fetchGlobalDataSources(@User() user, @Query() query) {
    const dataSources = await this.globalDataSourcesService.all(query, user.organizationId);
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
  async create(@User() user, @Query('environment_id') environmentId, @Body() createDataSourceDto: CreateDataSourceDto) {
    const { kind, name, options, plugin_id: pluginId, scope } = createDataSourceDto;

    const dataSource = await this.globalDataSourcesService.create(
      name,
      kind,
      options,
      user.organizationId,
      scope,
      pluginId,
      environmentId
    );
    return decamelizeKeys(dataSource);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createGlobalDataSources(@User() user, @Body() createDataSourceDto: CreateDataSourceDto) {
    const { kind, name, options, plugin_id: pluginId, scope } = createDataSourceDto;

    const dataSource = await this.globalDataSourcesService.create(
      name,
      kind,
      options,
      null,
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
    console.log({ idforog: user.organizationId, user });
    const { name, options } = updateDataSourceDto;

    await this.globalDataSourcesService.update(dataSourceId, user.organizationId, name, options, environmentId);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') dataSourceId) {
    const result = await this.globalDataSourcesService.delete(dataSourceId);
    if (result.affected == 1) {
      return;
    } else {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/authorize_oauth2')
  async authorizeOauth2(
    @User() user,
    @Param() params,
    @Query('environment_id') environmentId,
    @Body() authorizeDataSourceOauthDto: AuthorizeDataSourceOauthDto
  ) {
    const dataSourceId = params.id;
    const { code } = authorizeDataSourceOauthDto;

    const dataSource = await this.globalDataSourcesService.findOneByEnvironment(dataSourceId, environmentId);

    const { app } = dataSource;
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('authorizeOauthForSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    await this.dataQueriesService.authorizeOauth2(dataSource, code, user.id, environmentId);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/convert')
  async convertToGlobal(@User() user, @Param('id') dataSourceId) {
    await this.globalDataSourcesService.convertToGlobalSource(dataSourceId, user.organizationId);
    return;
  }
}
