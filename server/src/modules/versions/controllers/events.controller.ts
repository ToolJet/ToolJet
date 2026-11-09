import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { FEATURE_KEY } from '../constants';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { FeatureAbilityGuard } from '../ability/guard';
import { EventsService } from '@modules/apps/services/event.service';
import { AppDecorator as App } from '@modules/app/decorators/app.decorator';
import { App as AppEntity } from '@entities/app.entity';
import { CreateEventHandlerDto, UpdateEventHandlerDto, BulkCreateEventHandlerDto } from '@modules/apps/dto/event';
import { IEventsController } from '../interfaces/controllers/IEventsController';
import { assertVersionEditable } from '@modules/git-sync-configs/guards/git-sync-edit-guard';

// Saved and released versions are frozen, like their components and pages. The released-app viewer
// cache relies on it: it doesn't watch released content, so an edit there would never reach viewers.
const assertEditable = (app: AppEntity) => assertVersionEditable(app.appVersions?.[0]?.status);

@InitModule(MODULES.VERSION)
@Controller({
  path: 'apps',
  version: '2',
})
export class EventsController implements IEventsController {
  constructor(protected readonly eventService: EventsService) {}

  @InitFeature(FEATURE_KEY.GET_EVENTS)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Get(':id/versions/:versionId/events')
  async getEvents(@App() app: AppEntity, @Query('sourceId') sourceId) {
    return this.eventService.getEvents(app, sourceId);
  }

  @InitFeature(FEATURE_KEY.CREATE_EVENT)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/versions/:versionId/events')
  async createEvent(@App() app: AppEntity, @Body() createEventHandlerDto: CreateEventHandlerDto) {
    assertEditable(app);
    return this.eventService.createEvent(createEventHandlerDto, app.appVersions[0].id);
  }

  @InitFeature(FEATURE_KEY.CREATE_EVENT)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Post(':id/versions/:versionId/events/bulk')
  async bulkCreateEvents(@App() app: AppEntity, @Body() bulkCreateEventHandlerDto: BulkCreateEventHandlerDto) {
    assertEditable(app);
    return this.eventService.bulkCreateEvents(bulkCreateEventHandlerDto, app.appVersions[0].id);
  }

  @InitFeature(FEATURE_KEY.UPDATE_EVENT)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Put(':id/versions/:versionId/events')
  updateEvents(@App() app: AppEntity, @Body() updateEventHandlerDto: UpdateEventHandlerDto) {
    assertEditable(app);
    const { events, updateType } = updateEventHandlerDto;
    return this.eventService.updateEvent(events, updateType, app.appVersions[0].id);
  }

  @InitFeature(FEATURE_KEY.DELETE_EVENT)
  @UseGuards(JwtAuthGuard, ValidAppGuard, FeatureAbilityGuard)
  @Delete(':id/versions/:versionId/events/:eventId')
  async deleteEvents(@App() app: AppEntity, @Param('eventId') eventId) {
    assertEditable(app);
    return await this.eventService.deleteEvent(eventId, app.appVersions[0].id);
  }
}
