import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AppsActionsListener {
  constructor() {}
  @OnEvent('app.deleted')
  async handleAppDeletion(args: { appId: string }) {
    console.log(`App with ID ${args.appId} has been deleted.`);
  }
}
