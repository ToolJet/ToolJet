import { CreateEventHandlerDto, UpdateEventHandlerDto } from '@modules/apps/dto/event';
import { App as AppEntity } from '@entities/app.entity';

export interface IEventsController {
  getEvents(app: AppEntity, sourceId: string | undefined): Promise<any>;

  createEvent(app: AppEntity, createEventHandlerDto: CreateEventHandlerDto): Promise<any>;

  updateEvents(app: AppEntity, updateEventHandlerDto: UpdateEventHandlerDto): Promise<any>;

  deleteEvents(app: AppEntity, eventId: string): Promise<void>;
}
