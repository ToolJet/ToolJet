import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EventHandler } from 'src/entities/event_handler.entity';
import { dbTransactionWrap, dbTransactionForAppVersionAssociationsUpdate } from 'src/helpers/utils.helper';
import { CreateEventHandlerDto, UpdateEvent } from '@dto/event-handler.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventHandler)
    private eventsRepository: Repository<EventHandler>
  ) {}

  async findEventsForVersion(appVersionId: string): Promise<EventHandler[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const allEvents = await manager.find(EventHandler, {
        where: { appVersionId },
      });
      return allEvents;
    });
  }

  async findAllEventsWithSourceId(sourceId: string): Promise<EventHandler[]> {
    return this.eventsRepository.find({
      where: { sourceId },
    });
  }

  async cascadeDeleteEvents(sourceId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const allEvents = await manager.find(EventHandler, {
        where: { sourceId },
      });

      return await manager.remove(allEvents);
    });
  }

  async createEvent(eventHandler: CreateEventHandlerDto, versionId) {
    if (!eventHandler.attachedTo) {
      throw new BadRequestException('No attachedTo found');
    }

    if (!eventHandler.eventType) {
      throw new BadRequestException('No eventType found');
    }

    if (!eventHandler.event) {
      throw new BadRequestException('No event found');
    }

    return await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const newEvent = new EventHandler();
      newEvent.name = eventHandler.event.eventId;
      newEvent.sourceId = eventHandler.attachedTo;
      newEvent.target = eventHandler.eventType;
      newEvent.event = eventHandler.event;
      newEvent.index = eventHandler.index;
      newEvent.appVersionId = versionId;

      const event = await manager.save(EventHandler, newEvent);
      return event;
    }, versionId);
  }

  async updateEvent(events: UpdateEvent[], updateType: 'update' | 'reorder', appVersionId: string) {
    return await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      return await Promise.all(
        events.map(async (event) => {
          const { event_id, diff } = event;

          const eventDiff = diff?.event;
          const eventToUpdate = await manager.findOne(EventHandler, {
            where: { id: event_id },
          });

          if (!eventToUpdate) {
            return new BadRequestException('No event found');
          }

          const updatedEvent = {
            ...eventToUpdate,
          };

          if (updateType === 'update') {
            updatedEvent.name = eventDiff?.eventId;
            updatedEvent.event = eventDiff;
          }

          if (updateType === 'reorder') {
            updatedEvent.index = diff.index;
          }

          return await manager.save(EventHandler, updatedEvent);
        })
      );
    }, appVersionId);
  }

  async updateEventsOrderOnDelete(sourceId: string, deletedIndex: number) {
    const allEvents = await this.findAllEventsWithSourceId(sourceId);

    const eventsToUpdate = allEvents.filter((event) => event.index > deletedIndex);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await Promise.all(
        eventsToUpdate.map(async (event) => {
          return await manager.update(EventHandler, { id: event.id }, { index: event.index - 1 });
        })
      );
    });
  }

  async deleteEvent(eventId: string, appVersionId: string) {
    return await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const event = await manager.findOne(EventHandler, {
        where: { id: eventId },
      });

      const sourceId = event.sourceId;
      const deletedIndex = event.index;

      if (!event) {
        return new BadRequestException('No event found');
      }

      const deleteResponse = await manager.delete(EventHandler, event.id);

      if (!deleteResponse?.affected) {
        throw new NotFoundException();
      }
      await this.updateEventsOrderOnDelete(sourceId, deletedIndex);
      return deleteResponse;
    }, appVersionId);
  }
}
