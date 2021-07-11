import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { AppsService } from '../services/apps.service';
import { decamelizeKeys } from 'humps';

@Controller('apps')
export class AppsController {

  constructor(
    private appsService: AppsService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req) {
    const params = req.body;
    
    const app = await this.appsService.create(req.user);
    return decamelizeKeys(app);
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
