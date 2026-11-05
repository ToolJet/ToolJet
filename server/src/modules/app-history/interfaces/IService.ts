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
  isAiGenerated: boolean;
  // Set on an AI turn's entry: the chat message it came from (opens that turn in the compare view).
  aiMessageId?: string | null;
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
    historyId: string
  ): Promise<{
    success: boolean;
    newVersion: number;
    restoredAt: string;
  }>;

  updateDescription(historyId: string, updateDto: any): Promise<HistoryEntryDto>;
}
