import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
  Body,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';
import { AppAuthGuard } from 'src/modules/auth/app-auth.guard';
import { AppsService } from '../services/apps.service';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';

import { App } from 'src/entities/app.entity';
import { User } from 'src/decorators/user.decorator';

import { CreatePageDto, DeletePageDto } from '@dto/pages.dto';
import { CreateComponentDto, DeleteComponentDto, UpdateComponentDto, LayoutUpdateDto } from '@dto/component.dto';

import { ValidAppInterceptor } from 'src/interceptors/valid.app.interceptor';
import { AppDecorator } from 'src/decorators/app.decorator';

import { ComponentsService } from '@services/components.service';
import { PageService } from '@services/page.service';
import { EventsService } from '@services/events_handler.service';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';
import { CreateEventHandlerDto, UpdateEventHandlerDto } from '@dto/event-handler.dto';

@Controller({
  path: 'apps',
  version: '2',
})
export class AppsControllerV2 {
  constructor(
    private appsService: AppsService,
    private componentsService: ComponentsService,
    private pageService: PageService,
    private eventsService: EventsService,
    private eventService: EventsService,
    private appsAbilityFactory: AppsAbilityFactory
  ) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Get(':id')
  async show(@User() user, @AppDecorator() app: App, @Query('access_type') accessType: string) {
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);
    if (!ability.can('viewApp', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }

    if (accessType === 'edit' && !ability.can('editApp', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }

    const response = decamelizeKeys(app);

    const seralizedQueries = [];
    const dataQueriesForVersion = app.editingVersion
      ? await this.appsService.findDataQueriesForVersion(app.editingVersion.id)
      : [];

    const pagesForVersion = app.editingVersion ? await this.pageService.findPagesForVersion(app.editingVersion.id) : [];
    const eventsForVersion = app.editingVersion
      ? await this.eventsService.findEventsForVersion(app.editingVersion.id)
      : [];

    // serialize queries
    for (const query of dataQueriesForVersion) {
      const decamelizedQuery = decamelizeKeys(query);
      decamelizedQuery['options'] = query.options;
      seralizedQueries.push(decamelizedQuery);
    }

    response['data_queries'] = seralizedQueries;
    response['definition'] = app.editingVersion?.definition;
    response['pages'] = pagesForVersion;
    response['events'] = eventsForVersion;

    //! if editing version exists, camelize the definition
    if (app.editingVersion && app.editingVersion.definition) {
      response['editing_version'] = {
        ...response['editing_version'],
        definition: camelizeKeys(app.editingVersion.definition),
      };
    }
    return response;
  }

  @UseGuards(AppAuthGuard) // This guard will allow access for unauthenticated user if the app is public
  @Get('slugs/:slug')
  async appFromSlug(@User() user, @AppDecorator() app: App) {
    if (user) {
      const ability = await this.appsAbilityFactory.appsActions(user, app.id);

      if (!ability.can('viewApp', app)) {
        throw new ForbiddenException(
          JSON.stringify({
            organizationId: app.organizationId,
          })
        );
      }
    }

    const versionToLoad = app.currentVersionId
      ? await this.appsService.findVersion(app.currentVersionId)
      : await this.appsService.findVersion(app.editingVersion?.id);

    const pagesForVersion = app.editingVersion ? await this.pageService.findPagesForVersion(versionToLoad.id) : [];
    const eventsForVersion = app.editingVersion ? await this.eventsService.findEventsForVersion(versionToLoad.id) : [];

    // serialize
    return {
      current_version_id: app['currentVersionId'],
      data_queries: versionToLoad?.dataQueries,
      definition: versionToLoad?.definition,
      is_public: app.isPublic,
      is_maintenance_on: app.isMaintenanceOn,
      name: app.name,
      slug: app.slug,
      events: eventsForVersion,
      pages: pagesForVersion,
      homePageId: versionToLoad.homePageId,
      globalSettings: versionToLoad.globalSettings,
      showViewerNavigation: versionToLoad.showViewerNavigation,
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Get(':id/versions/:versionId')
  async version(@User() user, @Param('id') id, @Param('versionId') versionId) {
    const appVersion = await this.appsService.findVersion(versionId);
    const app = appVersion.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, app.id);

    if (!ability.can('fetchVersions', app)) {
      throw new ForbiddenException(
        JSON.stringify({
          organizationId: app.organizationId,
        })
      );
    }

    const pagesForVersion = await this.pageService.findPagesForVersion(versionId);
    const eventsForVersion = await this.eventsService.findEventsForVersion(versionId);

    const appCurrentEditingVersion = JSON.parse(JSON.stringify(appVersion));

    delete appCurrentEditingVersion['app'];

    const appData = {
      ...app,
    };

    delete appData['editingVersion'];

    return {
      ...appData,
      editing_version: camelizeKeys(appCurrentEditingVersion),
      pages: pagesForVersion,
      events: eventsForVersion,
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId')
  async updateVersion(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() appVersionUpdateDto: AppVersionUpdateDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.appsService.updateAppVersion(version, appVersionUpdateDto);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/global_settings')
  async updateGlobalSettings(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() appVersionUpdateDto: AppVersionUpdateDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.appsService.updateAppVersion(version, appVersionUpdateDto);
  }

  //components api
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Post(':id/versions/:versionId/components')
  async createComponent(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() createComponentDto: CreateComponentDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.componentsService.create(createComponentDto.diff, createComponentDto.pageId, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/components')
  async updateComponent(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() updateComponentDto: UpdateComponentDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.componentsService.update(updateComponentDto.diff, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Delete(':id/versions/:versionId/components')
  async deleteComponents(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() deleteComponentDto: DeleteComponentDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.componentsService.delete(deleteComponentDto.diff, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/components/layout')
  async updateComponentLayout(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() updateComponentLayout: LayoutUpdateDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.componentsService.componentLayoutChange(updateComponentLayout.diff, versionId);
  }

  // pages api
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Post(':id/versions/:versionId/pages')
  async createPages(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() createPageDto: CreatePageDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.pageService.createPage(createPageDto, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Post(':id/versions/:versionId/pages/:pageId/clone')
  async clonePage(@User() user, @Param('id') id, @Param('versionId') versionId, @Param('pageId') pageId) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.pageService.clonePage(pageId, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/pages')
  async updatePages(@User() user, @Param('id') id, @Param('versionId') versionId, @Body() updatePageDto) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.pageService.updatePage(updatePageDto, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Delete(':id/versions/:versionId/pages')
  async deletePage(@User() user, @Param('id') id, @Param('versionId') versionId, @Body() deletePageDto: DeletePageDto) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    await this.pageService.deletePage(deletePageDto.pageId, versionId);
  }

  // events api
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Post(':id/versions/:versionId/events')
  async createEvent(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() createEventHandlerDto: CreateEventHandlerDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return this.eventService.createEvent(createEventHandlerDto, versionId);
  }
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/events')
  async updateEvents(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() updateEventHandlerDto: UpdateEventHandlerDto
  ) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { events, updateType } = updateEventHandlerDto;

    return await this.eventService.updateEvent(events, updateType, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Delete(':id/versions/:versionId/events/:eventId')
  async deleteEvents(@User() user, @Param('id') id, @Param('versionId') versionId, @Param('eventId') eventId) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.eventService.deleteEvent(eventId, versionId);
  }
}
