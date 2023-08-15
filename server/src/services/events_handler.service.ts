import { BadRequestException, Injectable } from '@nestjs/common';
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

  async createEvent(options, versionId) {
    if (Object.keys(options).length === 0) {
      return new BadRequestException('No event found');
    }

    const newEvent = {
      name: options.event.eventId,
      sourceId: options.attachedTo,
      target: options.eventType,
      event: options.event,
      appVersionId: versionId,
    };

    console.log('---arpit || create events', { newEvent });

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const event = await manager.save(EventHandler, newEvent);
      return event;
    });
  }

  async updateEvent(options = [], versionId: string) {
    const eventHandlers = [];

    options.forEach((option) => {
      eventHandlers.push({
        event: option.event,
        name: option.event.eventId,
        sourceId: option.attachedTo,
        target: option.eventType,
      });
    });

    console.log('---arpit || createOrUpdateEvent', { eventHandlers });

    return {
      status: 'success',
      data: eventHandlers,
    };
  }

  //   utitlity functions
}
