import { Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
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

}
