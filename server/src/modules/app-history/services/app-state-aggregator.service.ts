import { Injectable } from '@nestjs/common';

@Injectable()
export class AppStateAggregatorService {
  constructor() {}

  async aggregateAppState(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getComponentsState(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getQueriesState(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getGlobalSettingsState(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async buildFullAppSnapshot(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}