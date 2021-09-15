import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { DataQueriesService } from '../../src/services/data_queries.service';
import { DataSourcesService } from '../../src/services/data_sources.service';
import { QueryError } from 'src/modules/data_sources/query.error';
import { QueryAuthGuard } from 'src/modules/auth/query-auth.guard';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { AppsService } from '@services/apps.service';

@Controller('data_queries')
export class DataQueriesController {

  constructor(
    private appsService: AppsService,
    private dataQueriesService: DataQueriesService,
    private dataSourcesService: DataSourcesService,
    private appsAbilityFactory: AppsAbilityFactory,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {

    const app = await this.appsService.find(query.app_id);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('getQueries', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const queries = await this.dataQueriesService.all(req.user, query.app_id);
    const seralizedQueries = [];

    // serialize
    for(const query of queries) {
      let decamelizedQuery = decamelizeKeys(query);

      decamelizedQuery['options'] = query.options;
      seralizedQueries.push(decamelizedQuery);
    }

    const response = { data_queries: seralizedQueries };

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const { kind, name, options } = req.body;
    const appId = req.body.app_id;

    const app = await this.appsService.find(appId);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('createQuery', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const dataSourceId = req.body.data_source_id;

    // Make sure that the data source belongs ot the app
    if(dataSourceId) {
      const dataSource = await this.dataSourcesService.findOne(dataSourceId);
      if(dataSource.appId !== appId) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    const dataQuery = await this.dataQueriesService.create(req.user, name, kind, options, appId, dataSourceId);
    return decamelizeKeys(dataQuery);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Request() req, @Param() params) {
    const { name, options } = req.body;
    const dataQueryId = params.id;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('updateQuery', dataQuery.app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.dataQueriesService.update(req.user, dataQueryId, name, options);
    return decamelizeKeys(result);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Request() req, @Param() params) {
    const dataQueryId = params.id;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if (!ability.can('deleteQuery', dataQuery.app)) {
      throw new ForbiddenException(
        'you do not have permissions to perform this action',
      );
    }

    const result = await this.dataQueriesService.delete(params.id);
    return decamelizeKeys(result);
  }

  @UseGuards(QueryAuthGuard)
  @Post(':id/run')
  async runQuery(@Request() req, @Param() params) {
    const dataQueryId = params.id;
    const { options } = req.body;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);

    if(req.user) {
      const ability = await this.appsAbilityFactory.appsActions(req.user, {});

      if(!ability.can('runQuery', dataQuery.app)) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    let result = {};

    try {
      result = await this.dataQueriesService.runQuery(req.user, dataQuery, options);
    } catch (error) {
      if (error instanceof QueryError) {
        result = {
          status: 'failed',
          message: error.message,
          description: error.description,
          data: error.data
        }
      } else {
        console.log(error);
        result = {
          status: 'failed',
          message: 'Internal server error',
          description: error.message,
          data: {}
        }
      }
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/preview')
  async previewQuery(@Request() req, @Param() params) {
    const { options, query } = req.body;
    const dataQueryEntity = {
      ...query,
      dataSource: await this.dataSourcesService.findOne(query['data_source_id'])
    }

    if(dataQueryEntity.dataSource) {
      const ability = await this.appsAbilityFactory.appsActions(req.user, {});

      if(!ability.can('previewQuery', dataQueryEntity.dataSource.app)) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    let result = {};

    try {
      result = await this.dataQueriesService.runQuery(req.user, dataQueryEntity, options);
    } catch (error) {
      if (error instanceof QueryError) {
        result = {
          status: 'failed',
          message: error.message,
          description: error.description,
          data: error.data
        }
      } else {
        console.log(error);
        result = {
          status: 'failed',
          message: 'Internal server error',
          description: error.message,
          data: {}
        }
      }
    }

    return result;
  }

}
