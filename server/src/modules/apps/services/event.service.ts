import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { EventHandler } from 'src/entities/event_handler.entity';
import { dbTransactionWrap, dbTransactionForAppVersionAssociationsUpdate } from 'src/helpers/database.helper';
import { CreateEventHandlerDto, UpdateEvent, BulkCreateEventHandlerDto } from '../dto/event';
import { App } from '@entities/app.entity';
import { IEventsService } from '../interfaces/services/IEventService';
import { ACTION_TYPE } from '@modules/app-history/constants';
import { AppHistoryUtilService } from '@modules/app-history/util.service';

@Injectable()
export class EventsService implements IEventsService {
  constructor(protected appHistoryUtilService: AppHistoryUtilService) {}

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

  async createEvent(eventHandler: CreateEventHandlerDto, versionId, skipHistoryCapture: boolean = false) {
    if (!eventHandler.attachedTo) {
      throw new BadRequestException('No attachedTo found');
    }

    if (!eventHandler.eventType) {
      throw new BadRequestException('No eventType found');
    }

    if (!eventHandler.event) {
      throw new BadRequestException('No event found');
    }

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

    // Skip history capture if requested (e.g., when called from AI service)
    if (skipHistoryCapture) {
      return result;
    }

    // Queue history capture after successful event creation
    setImmediate(async () => {
      try {
        // Resolve entity name based on event type (component, query, or page)
        let entityName = 'Unknown Component';

        if (eventHandler.attachedTo && eventHandler.eventType) {
          try {
            entityName = await this.appHistoryUtilService.resolveEntityName(
              eventHandler.attachedTo,
              eventHandler.eventType
            );
          } catch (error) {
            console.error('Failed to resolve entity name for event creation:', error);
          }
        }

        await this.appHistoryUtilService.queueHistoryCapture(versionId, ACTION_TYPE.EVENT_ADD, {
          eventName: eventHandler.event?.eventId || 'Unknown Event',
          componentName: entityName,
          componentId: eventHandler.attachedTo,
          operation: 'create',
          eventData: {
            id: result.id,
            name: eventHandler.event?.eventId,
            attachedTo: eventHandler.attachedTo,
            eventType: eventHandler.eventType,
            index: eventHandler.index,
          },
        });
      } catch (error) {
        console.error('Failed to queue history capture for event creation:', error);
      }
    });

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

    const results = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      return this.createEventsInTransaction(eventHandlers, versionId, manager);
    }, versionId);

    // Queue a single history capture for the bulk event creation
    setImmediate(async () => {
      try {
        // Get entity name from the first event for context
        let entityName = 'Unknown Component';
        const firstEvent = eventHandlers[0];

        if (firstEvent?.attachedTo && firstEvent?.eventType) {
          try {
            entityName = await this.appHistoryUtilService.resolveEntityName(
              firstEvent.attachedTo,
              firstEvent.eventType
            );
          } catch (error) {
            console.error('Failed to resolve entity name for bulk event creation:', error);
          }
        }

        await this.appHistoryUtilService.queueHistoryCapture(versionId, ACTION_TYPE.EVENT_ADD, {
          eventCount: results.length,
          componentName: entityName,
          componentId: firstEvent?.attachedTo,
          operation: 'bulk_create',
          eventData: results.map((event) => ({
            id: event.id,
            name: event.name,
            attachedTo: event.sourceId,
            eventType: event.target,
            index: event.index,
          })),
        });
      } catch (error) {
        console.error('Failed to queue history capture for bulk event creation:', error);
      }
    });

    return results;
  }

  async updateEvent(events: UpdateEvent[], updateType: 'update' | 'reorder', appVersionId: string) {
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

    // Queue history capture after successful event update
    setImmediate(async () => {
      try {
        const actionType = updateType === 'reorder' ? ACTION_TYPE.EVENT_REORDER : ACTION_TYPE.EVENT_UPDATE;

        // For single event updates, try to resolve names
        let entityName = 'Unknown Component';
        let eventName = 'Unknown Event';

        if (events.length === 1 && events[0]) {
          try {
            // Get the first event to resolve names
            const firstEvent = events[0];
            const eventDetails = await this.findEventById(firstEvent.event_id);

            if (eventDetails) {
              eventName = eventDetails.name || 'Unknown Event';

              if (eventDetails.sourceId && eventDetails.target) {
                entityName = await this.appHistoryUtilService.resolveEntityName(
                  eventDetails.sourceId,
                  eventDetails.target
                );
              }
            }
          } catch (error) {
            console.error('Failed to resolve event/entity names:', error);
          }
        }

        await this.appHistoryUtilService.queueHistoryCapture(appVersionId, actionType, {
          eventName: events.length === 1 ? eventName : undefined,
          componentName: events.length === 1 ? entityName : undefined,
          eventCount: events.length,
          operation: updateType,
          eventData: events.map((event) => ({
            id: event.event_id,
            diff: event.diff,
          })),
        });
      } catch (error) {
        console.error(`Failed to queue history capture for event ${updateType}:`, error);
      }
    });

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
    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
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

    try {
      await this.appHistoryUtilService.queueHistoryCapture(appVersionId, ACTION_TYPE.EVENT_DELETE, {
        eventId,
        operation: 'delete',
        // No need to pre-fetch eventName or componentName - queue processor will resolve from history
      });
    } catch (error) {
      console.error('Failed to queue history capture for event deletion:', error);
    }

    return result;
  }

  getEvents(app: App, sourceId: string): Promise<EventHandler[]> {
    if (!sourceId) {
      return this.findEventsForVersion(app.appVersions[0].id);
    }

    return this.findAllEventsWithSourceId(sourceId);
  }
}
