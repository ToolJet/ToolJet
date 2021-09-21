import { Bind, Controller, ForbiddenException, Get, Param, Post, Put, Query, Req, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { DataSourcesService } from '../../src/services/data_sources.service';
import { AppsService } from '@services/apps.service';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { DataQueriesService } from '@services/data_queries.service';

@Controller('data_sources')
export class DataSourcesController {

  constructor(
    private appsService: AppsService,
    private appsAbilityFactory: AppsAbilityFactory,
    private dataSourcesService: DataSourcesService,
    private dataQueriesService: DataQueriesService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {

    const app = await this.appsService.find(query.app_id);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('getDataSources', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const dataSources = await this.dataSourcesService.all(req.user, query.app_id);
    let response = decamelizeKeys({ data_sources: dataSources });

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const { kind, name, options } = req.body;
    const appId = req.body.app_id;

    const app = await this.appsService.find(appId);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('createDataSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const dataSource = await this.dataSourcesService.create(name, kind, options, appId);
    return decamelizeKeys(dataSource);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Request() req, @Param() params) {
    const dataSourceId = params.id;
    const { name, options } = req.body;

    const dataSource = await this.dataSourcesService.findOne(dataSourceId);

    const app = await this.appsService.find(dataSource.appId);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('updateDataSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.dataSourcesService.update(dataSourceId, name, options);
    return decamelizeKeys(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('test_connection')
  async testConnection(@Request() req) {
    const { kind, options } = req.body;
    return await this.dataSourcesService.testConnection(kind, options);
  }

  @UseGuards(JwtAuthGuard)
  @Post('fetch_oauth2_base_url')
  async getAuthUrl(@Request() req) {
    const { provider } = req.body;
    return await this.dataSourcesService.getAuthUrl(provider);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/authorize_oauth2')
  async authorizeOauth2(@Request() req, @Param() params) {
    const dataSourceId = params.id;
    const { code } = req.body;

    const dataSource = await this.dataSourcesService.findOne(dataSourceId);

    const app = await this.appsService.find(dataSource.appId);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('authorizeOauthForSource', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    return await this.dataQueriesService.authorizeOauth2(dataSource, code);
  }

}
