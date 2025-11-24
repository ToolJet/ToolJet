import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Component } from '@entities/component.entity';
import { Page } from '@entities/page.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource as DataSourceEntity } from '@entities/data_source.entity';
import { EventHandler, Target } from '@entities/event_handler.entity';
import { dbTransactionWrap } from '@helpers/database.helper';

@Injectable()
export class NameResolverRepository {
  async getComponentNames(componentIds: string[]): Promise<Record<string, string>> {
    if (!componentIds.length) return {};

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const components = await manager.find(Component, {
        where: { id: In(componentIds) },
        select: ['id', 'name'],
      });

      return components.reduce((acc, comp) => {
        acc[comp.id] = comp.name || 'Unnamed Component';
        return acc;
      }, {});
    });
  }

  async getPageNames(pageIds: string[]): Promise<Record<string, string>> {
    if (!pageIds.length) return {};

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const pages = await manager.find(Page, {
        where: { id: In(pageIds) },
        select: ['id', 'name'],
      });

      return pages.reduce((acc, page) => {
        acc[page.id] = page.name || 'Unnamed Page';
        return acc;
      }, {});
    });
  }

  async getQueryNames(queryIds: string[]): Promise<Record<string, string>> {
    if (!queryIds.length) return {};

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queries = await manager.find(DataQuery, {
        where: { id: In(queryIds) },
        select: ['id', 'name'],
      });

      return queries.reduce((acc, query) => {
        acc[query.id] = query.name || 'Unnamed Query';
        return acc;
      }, {});
    });
  }

  async getDataSourceNames(dataSourceIds: string[]): Promise<Record<string, string>> {
    if (!dataSourceIds.length) return {};

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const dataSources = await manager.find(DataSourceEntity, {
        where: { id: In(dataSourceIds) },
        select: ['id', 'name'],
      });

      return dataSources.reduce((acc, ds) => {
        acc[ds.id] = ds.name || 'Unnamed Data Source';
        return acc;
      }, {});
    });
  }

  async getEventNames(eventIds: string[]): Promise<Record<string, string>> {
    if (!eventIds.length) return {};

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const events = await manager.find(EventHandler, {
        where: { id: In(eventIds) },
        select: ['id', 'name'],
      });

      return events.reduce((acc, event) => {
        acc[event.id] = event.name || 'Unnamed Event';
        return acc;
      }, {});
    });
  }

  async getComponentWithPage(componentId: string): Promise<{ componentName: string; pageName: string }> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const component = await manager.findOne(Component, {
        where: { id: componentId },
        relations: ['page'],
        select: ['id', 'name', 'page'],
      });

      return {
        componentName: component?.name || 'Unnamed Component',
        pageName: component?.page?.name || 'Unnamed Page',
      };
    });
  }

  /**
   * Resolve name for an entity that could be a component, query, or page
   * This is used when events are attached to different entity types
   */
  async resolveEntityName(entityId: string, entityType: Target | string): Promise<string> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // For component-like entities, lookup component
      if (entityType === Target.component || entityType === Target.tableColumn || entityType === Target.tableAction) {
        const component = await manager.findOne(Component, {
          where: { id: entityId },
          select: ['id', 'name'],
        });
        return component?.name || 'Unknown Component';
      }

      // For data query entities, lookup query
      if (entityType === Target.dataQuery) {
        const query = await manager.findOne(DataQuery, {
          where: { id: entityId },
          select: ['id', 'name'],
        });
        return query?.name || 'Unknown Query';
      }

      // For page entities, lookup page
      if (entityType === Target.page) {
        const page = await manager.findOne(Page, {
          where: { id: entityId },
          select: ['id', 'name'],
        });
        return page?.name || 'Unknown Page';
      }

      return 'Unknown Entity';
    });
  }
}
