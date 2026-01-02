import { Injectable } from '@nestjs/common';

/**
 * CE stub for EntityChangeService
 * The EE version provides the actual implementation
 */
@Injectable()
export class EntityChangeService {
  buildComponentAddChanges(_components: any[], _layouts: any[]): any[] {
    return [];
  }

  buildComponentUpdateChanges(_oldComponents: any[], _newComponentData: Record<string, any>): any[] {
    return [];
  }

  buildComponentDeleteChanges(_componentIds: string[], _layoutIds: string[]): any[] {
    return [];
  }

  buildLayoutUpdateChanges(_oldLayouts: any[], _newLayoutData: Record<string, any>): any[] {
    return [];
  }

  buildQueryAddChanges(_queries: any[]): any[] {
    return [];
  }

  buildQueryUpdateChanges(_oldQueries: any[], _newQueryData: Record<string, any>): any[] {
    return [];
  }

  buildQueryDeleteChanges(_queryIds: string[]): any[] {
    return [];
  }

  buildPageAddChanges(_pages: any[]): any[] {
    return [];
  }

  buildPageUpdateChanges(_oldPages: any[], _newPageData: Record<string, any>): any[] {
    return [];
  }

  buildPageReorderChanges(_reorders: { id: string; index: number; pageGroupIndex?: number }[]): any[] {
    return [];
  }

  buildPageDeleteChanges(_pageIds: string[]): any[] {
    return [];
  }

  buildEventAddChanges(_events: any[]): any[] {
    return [];
  }

  buildEventUpdateChanges(_oldEvents: any[], _newEventData: Record<string, any>): any[] {
    return [];
  }

  buildEventReorderChanges(_reorders: { id: string; index: number }[]): any[] {
    return [];
  }

  buildEventDeleteChanges(_eventIds: string[]): any[] {
    return [];
  }

  buildVersionSettingsChanges(
    _versionId: string,
    _changes: { globalSettings?: any; pageSettings?: any; homePageId?: string }
  ): any[] {
    return [];
  }

  createChangeLog(_changes: any[], _actionType: string, _description: string, _affectedEntities?: string[]): any {
    return { changes: [], metadata: { actionType: '', description: '', affectedEntities: [] } };
  }

  applyChangesToState(_state: any, _changes: any[]): void {
    // No-op in CE
  }
}
