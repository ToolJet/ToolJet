import { Controller, ForbiddenException, Get, Param, Post, Put, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppsService } from '../services/apps.service';
import { decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';

@Controller('apps')
export class AppsController {

  constructor(
    private appsService: AppsService,
    private appsAbilityFactory: AppsAbilityFactory
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const params = req.body;
    
    const app = await this.appsService.create(req.user);
    return decamelizeKeys(app);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async show(@Request() req, @Param() params) {
    
    const app = await this.appsService.find(params.id);
    let response = decamelizeKeys(app);

    response['definition'] = app['definition'];

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Request() req, @Param() params) {

    const app = await this.appsService.find(params.id);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('updateParams', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }
    
    const result = await this.appsService.update(req.user, params.id, req.body.app);
    let response = decamelizeKeys(result);

    return response;
  }


  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {

    const page = req.query.page;

    const apps = await this.appsService.all(req.user, page);
    const totalCount = await this.appsService.count(req.user);

    const meta = {
      total_pages: Math.round(totalCount/10),
      total_count: totalCount,
      current_page: parseInt(page || 0)
    }

    const response = {
      meta,
      apps
    }

    return decamelizeKeys(response);
  }

}
