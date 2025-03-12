import { EventHandler } from 'src/entities/event_handler.entity';
import { CreateEventHandlerDto, UpdateEvent } from '@modules/apps/dto/event';
import { App } from '@entities/app.entity';

export interface IEventsService {
  findEventsForVersion(appVersionId: string): Promise<EventHandler[]>;
  findAllEventsWithSourceId(sourceId: string): Promise<EventHandler[]>;
  cascadeDeleteEvents(sourceId: string): Promise<void>;
  createEvent(eventHandler: CreateEventHandlerDto, versionId: string): Promise<EventHandler>;
  updateEvent(events: UpdateEvent[], updateType: 'update' | 'reorder', appVersionId: string): Promise<any>;
  updateEventsOrderOnDelete(sourceId: string, deletedIndex: number): Promise<void>;
  deleteEvent(eventId: string, appVersionId: string): Promise<any>;
  getEvents(app: App, sourceId: string): Promise<EventHandler[]>;
}
