import { Injectable } from '@nestjs/common';

@Injectable()
export class NameResolverService {
  constructor() {}

  async resolveUserName(userId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async resolveComponentName(componentId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async resolveQueryName(queryId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async resolvePageName(pageId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async resolveEntityNames(operationScope: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
}