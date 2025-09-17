import { ACTION_TYPE } from '../constants';

export interface HistoryEntryDto {
  id: string;
  sequenceNumber: number;
  description: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppHistoryService {
  captureChange(
    appVersionId: string,
    actionType: ACTION_TYPE,
    oldState: any,
    newState: any,
    operationScope?: Record<string, any>
  ): Promise<any>;

  getHistoryList(
    appVersionId: string,
    page?: number,
    limit?: number,
    filters?: any
  ): Promise<{
    entries: HistoryEntryDto[];
    pagination: any;
    currentVersion: number;
  }>;

  restoreToPoint(
    appVersionId: string,
    historyId: string,
    confirmRestore?: boolean
  ): Promise<{
    success: boolean;
    newVersion: number;
    restoredAt: string;
  }>;

  updateDescription(historyId: string, updateDto: any): Promise<HistoryEntryDto>;
}
