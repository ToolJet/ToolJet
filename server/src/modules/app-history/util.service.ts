import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EntityManager } from 'typeorm';
import { ACTION_TYPE } from '@modules/app-history/constants';
import { RequestContext } from '@modules/request-context/service';
import { AppVersion } from '@entities/app_version.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { dbTransactionWrap } from '@helpers/database.helper';
import { TransactionLogger } from '@modules/logging/service';

@Injectable()
export class AppHistoryUtilService {
  constructor(
    @InjectQueue('app-history') protected readonly historyQueue: Queue,
    protected readonly logger: TransactionLogger
  ) {}

  /**
   * Queue history capture - INSTANT and non-blocking
   * Only processes history for front-end apps
   */
  async queueHistoryCapture(
    appVersionId: string,
    actionType: ACTION_TYPE,
    operationScope?: Record<string, any>,
    isAiGenerated?: boolean,
    userId?: string
  ): Promise<void> {
    // Get app type using a single query with relation
    const appVersion = await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.findOne(AppVersion, {
        where: { id: appVersionId },
        relations: ['app'],
        select: {
          app: {
            type: true,
          },
        },
      });
    });

    if (!appVersion || !appVersion.app) {
      this.logger.warn(`AppVersion ${appVersionId} not found or has no associated app`);
      return;
    }

    // Only process history for front-end apps
    if (appVersion.app.type !== APP_TYPES.FRONT_END) {
      // Skip history capture for non-frontend apps (workflow, module, etc.)
      return;
    }

    // Get userId from the current request context if not provided
    let finalUserId = userId;
    if (!finalUserId) {
      const context = RequestContext.currentContext;
      finalUserId = (context?.req as any)?.user?.id || 'system';
    }

    // Log before adding to queue
    this.logger.log(`[QueueHistory] Adding job to queue for app ${appVersionId}, action: ${actionType}`);

    const job = await this.historyQueue.add('capture-change', {
      appVersionId,
      actionType,
      operationScope,
      userId: finalUserId,
      timestamp: Date.now(),
      isAiGenerated: isAiGenerated || false,
    });

    this.logger.log(`[QueueHistory] Job ${job.id} added successfully for app ${appVersionId}`);
  }

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
