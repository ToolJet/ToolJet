import { Controller, ForbiddenException, Get, Param, Post, Put, Query, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppsService } from '../services/apps.service';
import { decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { UsersService } from '@services/users.service';
import { AppAuthGuard } from 'src/modules/auth/app-auth.guard';

@Controller('apps')
export class AppsController {

  constructor(
    private appsService: AppsService,
    private appsAbilityFactory: AppsAbilityFactory,
    private usersService: UsersService
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

  @UseGuards(AppAuthGuard) // This guard will allow access for unauthenticated user if the app is public
  @Get('slugs/:slug')
  async appFromSlug(@Request() req, @Param() params) {

    if(req.user) {
      const app = await this.appsService.findBySlug(params.slug);
      const ability = await this.appsAbilityFactory.appsActions(req.user, {});

      if(!ability.can('viewApp', app)) {
        throw new ForbiddenException('you do not have permissions to perform this action');
      }
    }

    const app = await this.appsService.findBySlug(params.slug);

    // serialize
    return {
      current_version_id: app['current_version_id'],
      data_queries: app.dataQueries,
      definition: app.currentVersion?.definition || {},
      is_public: app.isPublic,
      name: app.name,
      slug: app.slug
    }
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

  @UseGuards(JwtAuthGuard)
  @Get(':id/users')
  async fetchUsers(@Request() req, @Param() params) {

    const app = await this.appsService.find(params.id);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('fetchUsers', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.appsService.fetchUsers(req.user, params.id);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/versions')
  async fetchVersions(@Request() req, @Param() params) {

    const app = await this.appsService.find(params.id);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('fetchVersions', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const result = await this.appsService.fetchVersions(req.user, params.id);
    return decamelizeKeys({ versions: result });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/versions')
  async createVersion(@Request() req) {

    const params = req.body;
    const versionName = params['versionName'];

    const app = await this.appsService.find(params.id);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('createVersions', app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const appUser = await this.appsService.createVersion(req.user, app, versionName);
    return decamelizeKeys(appUser);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/versions/:versionId')
  async updateVersion(@Request() req) {

    const params = req.body;
    const definition = params['definition'];

    const version = await this.appsService.findVersion(params.id);
    const ability = await this.appsAbilityFactory.appsActions(req.user, {});

    if(!ability.can('updateVersions', version.app)) {
      throw new ForbiddenException('you do not have permissions to perform this action');
    }

    const appUser = await this.appsService.updateVersion(req.user, version, definition);
    return decamelizeKeys(appUser);
  }

}
