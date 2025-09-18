import { Injectable } from '@nestjs/common';
import { IAppHistoryService, HistoryEntryDto } from './interfaces/IService';
import { ACTION_TYPE } from './constants';

@Injectable()
export class AppHistoryService implements IAppHistoryService {
  async captureChange(
    appVersionId: string,
    actionType: ACTION_TYPE,
    oldState: any,
    newState: any,
    operationScope?: Record<string, any>
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getHistoryList(
    appVersionId: string,
    page: number = 0,
    limit: number = 20,
    filters?: any
  ): Promise<{
    entries: HistoryEntryDto[];
    pagination: any;
    currentVersion: number;
  }> {
    throw new Error('Method not implemented.');
  }

  async restoreToPoint(
    appVersionId: string,
    historyId: string
  ): Promise<{
    success: boolean;
    newVersion: number;
    restoredAt: string;
  }> {
    throw new Error('Method not implemented.');
  }

  async updateDescription(historyId: string, updateDto: any): Promise<HistoryEntryDto> {
    throw new Error('Method not implemented.');
  }
}
