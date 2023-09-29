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
import { AppsService } from '../services/apps.service';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';

import { App } from 'src/entities/app.entity';
import { User } from 'src/decorators/user.decorator';

import { VersionEditDto } from '@dto/version-edit.dto';
import { CreatePageDto, UpdatePageDto } from '@dto/pages.dto';

import { ValidAppInterceptor } from 'src/interceptors/valid.app.interceptor';
import { AppDecorator } from 'src/decorators/app.decorator';

import { ComponentsService } from '@services/components.service';
import { PageService } from '@services/page.service';
import { EventsService } from '@services/events_handler.service';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

@Controller({
  path: 'apps',
  version: '2',
})
export class AppsControllerV2 {
  constructor(
    private appsService: AppsService,
    private componentsService: ComponentsService,
    private pageService: PageService,
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

    // serialize queries
    for (const query of dataQueriesForVersion) {
      const decamelizedQuery = decamelizeKeys(query);
      decamelizedQuery['options'] = query.options;
      seralizedQueries.push(decamelizedQuery);
    }

    response['data_queries'] = seralizedQueries;
    response['definition'] = app.editingVersion?.definition;
    response['pages'] = pagesForVersion;

    //! if editing version exists, camelize the definition
    if (app.editingVersion && app.editingVersion.definition) {
      response['editing_version'] = {
        ...response['editing_version'],
        definition: camelizeKeys(app.editingVersion.definition),
      };
    }
    return response;
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
    @Body() versionEditDto: VersionEditDto
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

    await this.componentsService.create(versionEditDto.diff, versionEditDto.pageId, versionId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/components')
  async updateComponent(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() versionEditDto: VersionEditDto
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

    await this.componentsService.update(versionEditDto.diff);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Delete(':id/versions/:versionId/components')
  async deleteComponents(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() versionEditDto: VersionEditDto
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

    await this.componentsService.delete(versionEditDto.diff);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/components/layout')
  async updateComponentLayout(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() versionEditDto: VersionEditDto
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

    await this.componentsService.componentLayoutChange(versionEditDto.diff);
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
  async updatePages(
    @User() user,
    @Param('id') id,
    @Param('versionId') versionId,
    @Body() updatePageDto: Partial<UpdatePageDto>
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

    await this.pageService.updatePage({ pageId: updatePageDto.pageId, diff: updatePageDto.diff });
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Delete(':id/versions/:versionId/pages')
  async deletePage(@User() user, @Param('id') id, @Param('versionId') versionId, @Body() body) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { pageId } = body;

    if (pageId) {
      await this.pageService.deletePage(pageId, versionId);
    }
  }

  // events api
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Post(':id/versions/:versionId/events')
  async createEvent(@User() user, @Param('id') id, @Param('versionId') versionId, @Body() body) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const { event } = body;

    return this.eventService.createEvent(event, versionId);
  }
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ValidAppInterceptor)
  @Put(':id/versions/:versionId/events')
  async updateEvents(@User() user, @Param('id') id, @Param('versionId') versionId, @Body() body) {
    const version = await this.appsService.findVersion(versionId);
    const app = version.app;

    if (app.id !== id) {
      throw new BadRequestException();
    }
    const ability = await this.appsAbilityFactory.appsActions(user, id);

    if (!ability.can('updateVersions', app)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    return await this.eventService.updateEvent(body?.events, body?.updateType);
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

    return await this.eventService.deleteEvent(eventId);
  }
}
