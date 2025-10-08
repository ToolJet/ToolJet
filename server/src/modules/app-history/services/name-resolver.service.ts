import { Injectable } from '@nestjs/common';
import { NameResolverRepository } from '../repositories/name-resolver.repository';

@Injectable()
export class NameResolverService {
  constructor(private readonly nameResolverRepository: NameResolverRepository) {}

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
}
