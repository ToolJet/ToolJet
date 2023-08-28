import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Component } from 'src/entities/component.entity';
// import { Page } from 'src/entities/page.entity';
import { EventHandler } from 'src/entities/event_handler.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Component)
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
    return dbTransactionWrap(async (manager: EntityManager) => {
      const allEvents = await manager.find(EventHandler, {
        where: { sourceId },
      });
      return allEvents;
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

  async createEvent(eventObj, versionId) {
    if (Object.keys(eventObj).length === 0) {
      return new BadRequestException('No event found');
    }

    const newEvent = {
      name: eventObj.event.eventId,
      sourceId: eventObj.attachedTo,
      target: eventObj.eventType,
      event: eventObj.event,
      appVersionId: versionId,
    };

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const event = await manager.save(EventHandler, newEvent);
      return event;
    });
  }

  async updateEvent(events: []) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await Promise.all(
        events.map(async (event) => {
          const { event_id, diff } = event as any;

          const eventDiff = diff?.event;
          const eventToUpdate = await manager.findOne(EventHandler, {
            where: { id: event_id },
          });

          if (!eventToUpdate) {
            return new BadRequestException('No event found');
          }

          const updatedEvent = {
            ...eventToUpdate,
            event: {
              ...eventToUpdate.event,
              ...eventDiff,
            },
          };

          return await manager.save(EventHandler, updatedEvent);
        })
      );
    });
  }

  async deleteEvent(eventId: string) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const event = await manager.findOne(EventHandler, {
        where: { id: eventId },
      });

      if (!event) {
        return new BadRequestException('No event found');
      }

      const deleteResponse = await manager.delete(EventHandler, event.id);

      if (!deleteResponse?.affected) {
        throw new NotFoundException();
      }
      return deleteResponse;
    });
  }
}
