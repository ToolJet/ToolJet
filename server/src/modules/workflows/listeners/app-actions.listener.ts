import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AppsActionsListener {
  private readonly logger = new Logger(AppsActionsListener.name);

  constructor() {}
  @OnEvent('app.deleted')
  async handleAppDeletion(args: { appId: string }) {
    this.logger.log(`App with ID ${args.appId} has been deleted.`);
  }
}
