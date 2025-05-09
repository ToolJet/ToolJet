import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AppsActionsListener {
  constructor() {}
  @OnEvent('beforeAppDelete')
  async handleAppDeletion(args: { appId: string }) {
    throw new Error('Method not implemented');
  }
}
