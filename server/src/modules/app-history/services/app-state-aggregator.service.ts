import { Injectable } from '@nestjs/common';
import { AppStateRepository } from '../repositories/app-state.repository';

@Injectable()
export class AppStateAggregatorService {
  constructor(private readonly appStateRepository: AppStateRepository) {}

  async getCompleteAppState(appVersionId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
