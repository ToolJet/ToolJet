import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EventHandler } from 'src/entities/event_handler.entity';
import { dbTransactionWrap, dbTransactionForAppVersionAssociationsUpdate } from 'src/helpers/database.helper';
import { CreateEventHandlerDto, UpdateEvent, BulkCreateEventHandlerDto } from '../dto/event';
import { App } from '@entities/app.entity';
import {
  IEventsService,
  EventCreateContext,
  EventBulkCreateContext,
  EventUpdateContext,
  EventDeleteContext,
} from '../interfaces/services/IEventService';

@Injectable()
export class EventsService implements IEventsService {
  /**
   * Hook called before event creation - override in EE to capture state for history
   */
  protected async beforeEventCreate(
    eventHandler: CreateEventHandlerDto,
    versionId: string
  ): Promise<EventCreateContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after event creation - override in EE to queue history
   */
  protected async afterEventCreate(
    context: EventCreateContext | null,
    createdEvent: EventHandler,
    versionId: string,
    skipHistoryCapture: boolean
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  /**
   * Hook called before bulk event creation - override in EE to capture state for history
   */
  protected async beforeBulkEventCreate(
    eventHandlers: CreateEventHandlerDto[],
    versionId: string
  ): Promise<EventBulkCreateContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after bulk event creation - override in EE to queue history
   */
  protected async afterBulkEventCreate(
    context: EventBulkCreateContext | null,
    createdEvents: EventHandler[],
    versionId: string
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  /**
   * Hook called before event update - override in EE to capture state for history
   */
  protected async beforeEventUpdate(
    events: UpdateEvent[],
    updateType: 'update' | 'reorder',
    appVersionId: string
  ): Promise<EventUpdateContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after event update - override in EE to queue history
   */
  protected async afterEventUpdate(
    context: EventUpdateContext | null,
    updatedEvents: EventHandler[],
    updateType: 'update' | 'reorder',
    appVersionId: string
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  /**
   * Hook called before event deletion - override in EE to capture state for history
   */
  protected async beforeEventDelete(
    eventId: string,
    appVersionId: string
  ): Promise<EventDeleteContext | null> {
    return null; // No-op in CE, EE overrides
  }

  /**
   * Hook called after event deletion - override in EE to queue history
   */
  protected async afterEventDelete(
    context: EventDeleteContext | null,
    eventId: string,
    appVersionId: string
  ): Promise<void> {
    // No-op in CE, EE overrides to capture history
  }

  async findEventById(eventId: string): Promise<EventHandler> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const event = await manager.findOne(EventHandler, {
        where: { id: eventId },
      });
      return event;
    });
  }

  async findEventsForVersion(appVersionId: string, manager?: EntityManager): Promise<EventHandler[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const allEvents = await manager.find(EventHandler, {
        where: { appVersionId },
      });
      return allEvents;
    }, manager);
  }

  async findAllEventsWithSourceId(sourceId: string): Promise<EventHandler[]> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.find(EventHandler, {
        where: { sourceId },
      });
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

  async createEvent(eventHandler: CreateEventHandlerDto, versionId: string, skipHistoryCapture: boolean = false) {
    if (!eventHandler.attachedTo) {
      throw new BadRequestException('No attachedTo found');
    }

    if (!eventHandler.eventType) {
      throw new BadRequestException('No eventType found');
    }

    if (!eventHandler.event) {
      throw new BadRequestException('No event found');
    }

    const context = skipHistoryCapture ? null : await this.beforeEventCreate(eventHandler, versionId);

    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      if (
        eventHandler.eventType === 'component' ||
        eventHandler.eventType === 'table_column' ||
        eventHandler.eventType === 'table_action'
      ) {
        const componentExists = await manager.findOne('Component', {
          where: {
            id: eventHandler.attachedTo,
          },
        });

        if (!componentExists) {
          throw new BadRequestException('Component does not exist');
        }
      }

      if (eventHandler.eventType === 'data_query') {
        const dataQueryExists = await manager.findOne('DataQuery', {
          where: {
            id: eventHandler.attachedTo,
          },
        });

        if (!dataQueryExists) {
          throw new BadRequestException('Data Query does not exist');
        }
      }

      if (eventHandler.eventType === 'page') {
        const pageExists = await manager.findOne('Page', {
          where: {
            id: eventHandler.attachedTo,
          },
        });

        if (!pageExists) {
          throw new BadRequestException('Page does not exist');
        }
      }

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

    await this.afterEventCreate(context, result, versionId, skipHistoryCapture);

    return result;
  }

  /**
   * Core method to create events in batch - can be used within an existing transaction
   * @param events - Array of event handler DTOs to create
   * @param versionId - App version ID
   * @param manager - EntityManager for the transaction
   * @param options - Optional settings (skipValidation for when entities are created in same transaction)
   */
  async createEventsInTransaction(
    events: CreateEventHandlerDto[],
    versionId: string,
    manager: EntityManager,
    options: { skipValidation?: boolean } = {}
  ): Promise<EventHandler[]> {
    const createdEvents: EventHandler[] = [];

    for (const eventHandler of events) {
      // Skip events with missing required fields
      if (!eventHandler.attachedTo || !eventHandler.eventType || !eventHandler.event) {
        continue;
      }

      // Validate entity existence unless skipped (e.g., when entities are created in same transaction)
      if (!options.skipValidation) {
        if (
          eventHandler.eventType === 'component' ||
          eventHandler.eventType === 'table_column' ||
          eventHandler.eventType === 'table_action'
        ) {
          const componentExists = await manager.findOne('Component', {
            where: { id: eventHandler.attachedTo },
          });

          if (!componentExists) {
            throw new BadRequestException('Component does not exist');
          }
        }

        if (eventHandler.eventType === 'data_query') {
          const dataQueryExists = await manager.findOne('DataQuery', {
            where: { id: eventHandler.attachedTo },
          });

          if (!dataQueryExists) {
            throw new BadRequestException('Data Query does not exist');
          }
        }

        if (eventHandler.eventType === 'page') {
          const pageExists = await manager.findOne('Page', {
            where: { id: eventHandler.attachedTo },
          });

          if (!pageExists) {
            throw new BadRequestException('Page does not exist');
          }
        }
      }

      const newEvent = new EventHandler();
      newEvent.name = eventHandler.event.eventId;
      newEvent.sourceId = eventHandler.attachedTo;
      newEvent.target = eventHandler.eventType;
      newEvent.event = eventHandler.event;
      newEvent.index = eventHandler.index;
      newEvent.appVersionId = versionId;

      const savedEvent = await manager.save(EventHandler, newEvent);
      createdEvents.push(savedEvent);
    }

    return createdEvents;
  }

  /**
   * Bulk create events with its own transaction and history capture
   * Use this when creating events as a standalone operation (not part of a larger batch)
   */
  async bulkCreateEvents(
    bulkEventHandlerDto: BulkCreateEventHandlerDto,
    versionId: string
  ): Promise<EventHandler[]> {
    const { events: eventHandlers } = bulkEventHandlerDto;

    if (!eventHandlers || eventHandlers.length === 0) {
      return [];
    }

    const context = await this.beforeBulkEventCreate(eventHandlers, versionId);

    const results = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      return this.createEventsInTransaction(eventHandlers, versionId, manager);
    }, versionId);

    await this.afterBulkEventCreate(context, results, versionId);

    return results;
  }

  async updateEvent(events: UpdateEvent[], updateType: 'update' | 'reorder', appVersionId: string) {
    const context = await this.beforeEventUpdate(events, updateType, appVersionId);

    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
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

    await this.afterEventUpdate(context, result as EventHandler[], updateType, appVersionId);

    return result;
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
    const context = await this.beforeEventDelete(eventId, appVersionId);

    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const event = await manager.findOne(EventHandler, {
        where: { id: eventId },
      });

      if (!event) {
        return new BadRequestException('No event found');
      }

      const sourceId = event.sourceId;
      const deletedIndex = event.index;

      const deleteResponse = await manager.delete(EventHandler, event.id);

      if (!deleteResponse?.affected) {
        throw new NotFoundException();
      }
      await this.updateEventsOrderOnDelete(sourceId, deletedIndex);
      return deleteResponse;
    }, appVersionId);

    await this.afterEventDelete(context, eventId, appVersionId);

    return result;
  }

  getEvents(app: App, sourceId: string): Promise<EventHandler[]> {
    if (!sourceId) {
      return this.findEventsForVersion(app.appVersions[0].id);
    }

    return this.findAllEventsWithSourceId(sourceId);
  }
}
