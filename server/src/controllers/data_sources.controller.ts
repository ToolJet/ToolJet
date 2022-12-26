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
import { DataSourcesService } from '../../src/services/data_sources.service';
import { AppsService } from '@services/apps.service';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { DataQueriesService } from '@services/data_queries.service';
import {
  AuthorizeDataSourceOauthDto,
  CreateDataSourceDto,
  GetDataSourceOauthUrlDto,
  TestDataSourceDto,
  UpdateDataSourceDto,
} from '@dto/data-source.dto';
import { decode } from 'js-base64';
import { User } from 'src/decorators/user.decorator';

@Controller('data_sources')
export class DataSourcesController {
  constructor(
    private appsService: AppsService,
    private appsAbilityFactory: AppsAbilityFactory,
    private dataSourcesService: DataSourcesService,
    private dataQueriesService: DataQueriesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@User() user, @Query() query) {
    const app = await this.appsService.findAppFromVersion(query.app_version_id);
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('getDataSources', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const dataSources = await this.dataSourcesService.all(query);
    for (const dataSource of dataSources) {
      if (dataSource.pluginId) {
        dataSource.plugin.iconFile.data = dataSource.plugin.iconFile.data.toString('utf8');
        dataSource.plugin.manifestFile.data = JSON.parse(decode(dataSource.plugin.manifestFile.data.toString('utf8')));
        dataSource.plugin.operationsFile.data = JSON.parse(
          decode(dataSource.plugin.operationsFile.data.toString('utf8'))
        );
      }
    }
    return decamelizeKeys({ data_sources: dataSources });
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Query('environment_id') environmentId, @Body() createDataSourceDto: CreateDataSourceDto) {
    const { kind, name, options, app_version_id: appVersionId, plugin_id: pluginId } = createDataSourceDto;

    const app = await this.appsService.findAppFromVersion(appVersionId);
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('createDataSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const dataSource = await this.dataSourcesService.create(name, kind, options, appVersionId, pluginId, environmentId);
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
    const { name, options } = updateDataSourceDto;

    const dataSource = await this.dataSourcesService.findOne(dataSourceId);

    const { app } = dataSource;
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('updateDataSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    await this.dataSourcesService.update(dataSourceId, name, options, environmentId);
    return;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@User() user, @Param('id') dataSourceId) {
    const dataSource = await this.dataSourcesService.findOne(dataSourceId);

    const { app } = dataSource;
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('deleteDataSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.dataSourcesService.delete(dataSourceId);
    if (result.affected == 1) {
      return;
    } else {
      throw new BadRequestException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('test_connection')
  async testConnection(@Body() testDataSourceDto: TestDataSourceDto) {
    const { kind, options, plugin_id } = testDataSourceDto;
    return await this.dataSourcesService.testConnection(kind, options, plugin_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('fetch_oauth2_base_url')
  async getAuthUrl(@Body() getDataSourceOauthUrlDto: GetDataSourceOauthUrlDto) {
    const { provider } = getDataSourceOauthUrlDto;
    return await this.dataSourcesService.getAuthUrl(provider);
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

    const dataSource = await this.dataSourcesService.findOneByEnvironment(dataSourceId, environmentId);

    const { app } = dataSource;
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('authorizeOauthForSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    await this.dataQueriesService.authorizeOauth2(dataSource, code, user.id, environmentId);
    return;
  }
}
