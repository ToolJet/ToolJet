import { Controller, Get, Param, Post, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { DataQueriesService } from '../../src/services/data_queries.service';
import { DataSourcesService } from '../../src/services/data_sources.service';
import { QueryError } from 'src/modules/data_sources/query.error';

@Controller('data_queries')
export class DataQueriesController {

  constructor(
    private dataQueriesService: DataQueriesService,
    private dataSourcesService: DataSourcesService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {
    
    const queries = await this.dataQueriesService.all(req.user, query.app_id);
    let response = decamelizeKeys({ data_queries: queries });

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const { kind, name, options } = req.body;
    const appId = req.body.app_id;
    const dataSourceId = req.body.data_source_id;
    
    const dataQuery = await this.dataQueriesService.create(req.user, name, kind, options, appId, dataSourceId);
    return decamelizeKeys(dataQuery);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id') 
  async update(@Request() req, @Param() params) {
    const { name, options } = req.body;
    const dataQueryId = params.id;
    
    const dataQuery = await this.dataQueriesService.update(req.user, dataQueryId, name, options);
    return decamelizeKeys(dataQuery);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/run') 
  async runQuery(@Request() req, @Param() params) {
    const dataQueryId = params.id;
    const { options } = req.body;

    const dataQuery = await this.dataQueriesService.findOne(dataQueryId);

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
