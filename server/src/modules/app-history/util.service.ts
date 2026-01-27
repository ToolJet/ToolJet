import { Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ACTION_TYPE } from '@modules/app-history/constants';
import { AppVersion } from '@entities/app_version.entity';
import { TransactionLogger } from '@modules/logging/service';
import { NameResolverRepository } from './repositories/name-resolver.repository';
import { AppVersionUpdateDto } from '@dto/app-version-update.dto';

@Injectable()
export class AppHistoryUtilService {
  constructor(
    @Optional() @InjectQueue('app-history') protected readonly historyQueue: Queue,
    protected readonly logger: TransactionLogger,
    protected readonly nameResolverRepository: NameResolverRepository
  ) { }

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
   * Queue history capture - stub method for CE
   * Actual history capture is handled by EE queuePrebuiltDelta
   */
  async queueHistoryCapture(
    appVersionId: string,
    actionType: ACTION_TYPE,
    operationScope?: Record<string, any>,
    isAiGenerated?: boolean,
    userId?: string
  ): Promise<void> {
    // No-op in CE - history capture is handled by EE override
  }

  /**
   * Capture history for app version settings updates (homePageId, globalSettings, pageSettings)
   * Handled by EE override
   */
  async captureSettingsUpdateHistory(appVersion: AppVersion, appVersionUpdateDto: AppVersionUpdateDto): Promise<void> {
    // No-op in CE - history capture is handled by EE override
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
