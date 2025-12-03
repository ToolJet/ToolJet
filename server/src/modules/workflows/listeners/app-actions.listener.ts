import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';

@Injectable()
export class AppsActionsListener {
  constructor(private readonly logger: Logger) {}
  @OnEvent('app.deleted')
  async handleAppDeletion(args: { appId: string }) {
    this.logger.debug(`App with ID ${args.appId} has been deleted.`);
  }
}
