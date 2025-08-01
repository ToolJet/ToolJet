import { createLogger } from '@helpers/bootstrap.helper';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventListenerService implements OnApplicationBootstrap {
  constructor(private eventEmitter: EventEmitter2) {}

  onApplicationBootstrap() {
    // Get all event names
    const eventNames = this.eventEmitter.eventNames();
    const logger = createLogger('EventListenerService');
    let shouldExit = false;

    logger.log(`Registered Event Listeners: ${eventNames.length}`);
    eventNames.forEach((eventName) => {
      const listeners = this.eventEmitter.listeners(eventName);
      if (listeners?.length > 1) {
        logger.warn(`Multiple listeners found for event: ${eventName.toString()} - ${listeners.length} listeners`);
        shouldExit = true;
      } else {
        logger.log(`Event: ${eventName.toString()} - Registered`);
      }
    });

    if (shouldExit) {
      logger.error(`Application startup failed due to multiple event listeners.`);
      process.exit(1);
    }
  }
}
