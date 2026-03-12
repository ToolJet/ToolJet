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
import { NameResolverRepository } from './repositories/name-resolver.repository';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

@Injectable()
export class AppHistoryUtilService {
  constructor(
    // @InjectQueue('app-history') protected readonly historyQueue: Queue,
    protected readonly logger: TransactionLogger,
    protected readonly nameResolverRepository: NameResolverRepository
  ) {}

  async resolveComponentNames(componentIds: string[]): Promise<Record<string, string>> {
    return this.nameResolverRepository.getComponentNames(componentIds);
  }

  async resolvePageNames(pageIds: string[]): Promise<Record<string, string>> {
    return this.nameResolverRepository.getPageNames(pageIds);
  }

  async resolveQueryNames(queryIds: string[]): Promise<Record<string, string>> {
    return this.nameResolverRepository.getQueryNames(queryIds);
  }

  async resolveDataSourceNames(dataSourceIds: string[]): Promise<Record<string, string>> {
    return this.nameResolverRepository.getDataSourceNames(dataSourceIds);
  }

  async resolveEventNames(eventIds: string[]): Promise<Record<string, string>> {
    return this.nameResolverRepository.getEventNames(eventIds);
  }

  async resolveComponentWithPage(componentId: string): Promise<{ componentName: string; pageName: string }> {
    return this.nameResolverRepository.getComponentWithPage(componentId);
  }

  async resolveEntityName(entityId: string, entityType: string): Promise<string> {
    return this.nameResolverRepository.resolveEntityName(entityId, entityType);
  }

  async batchResolveNames(entityIds: {
    componentIds?: string[];
    pageIds?: string[];
    queryIds?: string[];
    dataSourceIds?: string[];
    eventIds?: string[];
  }): Promise<{
    components: Record<string, string>;
    pages: Record<string, string>;
    queries: Record<string, string>;
    dataSources: Record<string, string>;
    events: Record<string, string>;
  }> {
    const [components, pages, queries, dataSources, events] = await Promise.all([
      this.resolveComponentNames(entityIds.componentIds || []),
      this.resolvePageNames(entityIds.pageIds || []),
      this.resolveQueryNames(entityIds.queryIds || []),
      this.resolveDataSourceNames(entityIds.dataSourceIds || []),
      this.resolveEventNames(entityIds.eventIds || []),
    ]);

    return { components, pages, queries, dataSources, events };
  }

  /**
   * Queue history capture - INSTANT and non-blocking
   * Only processes history for front-end apps
   */
  // App history temporarily disabled: setup is incomplete in cloud environment and caused a prod bug.
  // TODO: Re-enable queueing only after the setup flow is finished and validated end-to-end in cloud environment.
  async queueHistoryCapture(
    appVersionId: string,
    actionType: ACTION_TYPE,
    operationScope?: Record<string, any>,
    isAiGenerated?: boolean,
    userId?: string
  ): Promise<void> {
    // // Get app type using a single query with relation
    // const appVersion = await dbTransactionWrap(async (manager: EntityManager) => {
    //   return await manager.findOne(AppVersion, {
    //     where: { id: appVersionId },
    //     relations: ['app'],
    //     select: {
    //       app: {
    //         type: true,
    //       },
    //     },
    //   });
    // });
    // if (!appVersion || !appVersion.app) {
    //   this.logger.warn(`AppVersion ${appVersionId} not found or has no associated app`);
    //   return;
    // }
    // // Only process history for front-end apps
    // if (appVersion.app.type !== APP_TYPES.FRONT_END) {
    //   // Skip history capture for non-frontend apps (workflow, module, etc.)
    //   return;
    // }
    // // Get userId from the current request context if not provided
    // let finalUserId = userId;
    // if (!finalUserId) {
    //   const context = RequestContext.currentContext;
    //   finalUserId = (context?.req as any)?.user?.id || 'system';
    // }
    // // Log before adding to queue
    // this.logger.log(`[QueueHistory] Adding job to queue for app ${appVersionId}, action: ${actionType}`);
    // const job = await this.historyQueue.add('capture-change', {
    //   appVersionId,
    //   actionType,
    //   operationScope,
    //   userId: finalUserId,
    //   timestamp: Date.now(),
    //   isAiGenerated: isAiGenerated || false,
    // });
    // this.logger.log(`[QueueHistory] Job ${job.id} added successfully for app ${appVersionId}`);
  }

  /**
   * Capture history for app version settings updates (homePageId, globalSettings, pageSettings)
   */
  async captureSettingsUpdateHistory(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto): Promise<void> {
    try {
      // Check if homePageId, globalSettings, or pageSettings are being updated
      const hasSettingsUpdate =
        appVersionUpdateDto.homePageId || appVersionUpdateDto.globalSettings || appVersionUpdateDto.pageSettings;

      if (hasSettingsUpdate) {
        // Determine the action type based on what's being updated
        let actionType: ACTION_TYPE;
        let settingsType: string;

        if (appVersionUpdateDto.pageSettings) {
          actionType = ACTION_TYPE.PAGE_SETTINGS_UPDATE;
          settingsType = 'page';
        } else {
          actionType = ACTION_TYPE.GLOBAL_SETTINGS_UPDATE;
          settingsType = 'global';
        }

        const operationScope: any = {
          operation: 'update_settings',
          settings: appVersionUpdateDto.pageSettings || appVersionUpdateDto.globalSettings || appVersionUpdateDto,
          settingsType,
        };

        // If homePageId is being updated, include it in the operation scope for better description
        if (appVersionUpdateDto.homePageId && appVersion.homePageId !== appVersionUpdateDto.homePageId) {
          operationScope.homePageId = appVersionUpdateDto.homePageId;
          operationScope.previousHomePageId = appVersion.homePageId;
        }

        await this.queueHistoryCapture(appVersion.id, actionType, operationScope);
      }
    } catch (error) {
      console.error('Failed to queue history capture for settings update:', error);
    }
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
