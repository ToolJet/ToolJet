import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { decamelizeKeys } from 'humps';
import { DataSourcesService } from '../../src/services/data_sources.service';

@Controller('data_sources')
export class DataSourcesController {

  constructor(
    private dataSourcesService: DataSourcesService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {
    
    const dataSources = await this.dataSourcesService.all(req.user, query.app_id);
    let response = decamelizeKeys({ data_sources: dataSources });

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const { kind, name, options } = req.body;
    const appId = req.body.app_id;
    
    const dataSource = await this.dataSourcesService.create(req.user, name, kind, options, appId);
    return decamelizeKeys(dataSource);
  }

}
