import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AppsService } from './apps.service';
import { decamelizeKeys } from 'humps';

@Controller('apps')
export class AppsController {

  constructor(
    private appsService: AppsService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async index(@Request() req, @Query() query) {

    const page = req.query.page;

    const apps = await this.appsService.all(req.user, page);
    const totalCount = await this.appsService.count(req.user);

    const meta = {
      total_pages: Math.round(totalCount/10),
      total_count: totalCount,
      current_page: page || 0
    }

    const response = {
      meta,
      apps
    }

    return decamelizeKeys(response);
  }

}
