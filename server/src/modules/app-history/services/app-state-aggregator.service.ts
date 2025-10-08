import { Injectable } from '@nestjs/common';
import { AppStateRepository } from '../repositories/app-state.repository';

@Injectable()
export class AppStateAggregatorService {
  constructor(private readonly appStateRepository: AppStateRepository) {}

  async aggregateAppState(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getComponentsState(appVersionId: string): Promise<any> {
    return this.appStateRepository.getComponentsState(appVersionId);
  }

  async getQueriesState(appVersionId: string): Promise<any> {
    return this.appStateRepository.getQueriesState(appVersionId);
  }

  async getGlobalSettingsState(appVersionId: string): Promise<any> {
    return this.appStateRepository.getGlobalSettingsState(appVersionId);
  }

  async buildFullAppSnapshot(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
