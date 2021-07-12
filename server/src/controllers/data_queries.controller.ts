import { Controller, Get, Param, Post, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { AppsService } from '../services/apps.service';
import { decamelizeKeys } from 'humps';
import { DataQueriesService } from 'src/services/data_queries.service';

@Controller('data_queries')
export class DataQueriesController {

  constructor(
    private dataQueriesService: DataQueriesService
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

}
