import { Injectable } from '@nestjs/common';

@Injectable()
export class AppHistoryUtilService {
  constructor() {}

  async validateAppVersionAccess(appVersionId: string, userId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async sanitizeHistoryData(historyData: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async formatHistoryEntry(entry: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async calculateStateDiff(oldState: any, newState: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async generateHistoryDescription(actionType: string, operationScope: any): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async isHistoryEnabled(appVersionId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}