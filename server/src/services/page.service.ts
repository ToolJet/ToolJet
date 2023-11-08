import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Page } from 'src/entities/page.entity';
import { ComponentsService } from './components.service';
import { CreatePageDto, UpdatePageDto } from '@dto/pages.dto';
import { AppsService } from './apps.service';
import { dbTransactionWrap, dbTransactionForAppVersionAssociationsUpdate } from 'src/helpers/utils.helper';
import { EventsService } from './events_handler.service';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { EventHandler } from 'src/entities/event_handler.entity';

@Injectable()
export class PageService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,

    private componentsService: ComponentsService,
    private eventHandlerService: EventsService,
    private appService: AppsService
  ) {}

  async findPagesForVersion(appVersionId: string): Promise<Page[]> {
    const allPages = await this.pageRepository.find({ appVersionId });

    const pagesWithComponents = await Promise.all(
      allPages.map(async (page) => {
        const components = await this.componentsService.getAllComponents(page.id);
        delete page.appVersionId;
        return { ...page, components };
      })
    );

    return pagesWithComponents;
  }

  async findOne(id: string): Promise<Page> {
    return this.pageRepository.findOne(id);
  }

  async createPage(page: CreatePageDto, appVersionId: string): Promise<Page> {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager) => {
      const newPage = new Page();
      newPage.id = page.id;
      newPage.name = page.name;
      newPage.handle = page.handle;
      newPage.index = page.index;
      newPage.appVersionId = appVersionId;

      return await manager.save(Page, newPage);
    }, appVersionId);
  }

  async clonePage(pageId: string, appVersionId: string) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager) => {
      const pageToClone = await manager.findOne(Page, pageId);

      if (!pageToClone) {
        throw new Error('Page not found');
      }

      let pageName = `${pageToClone.name} (copy)`;
      let pageHandle = `${pageToClone.handle}-copy`;

      const allPages = await this.pageRepository.find({ appVersionId });

      const pageNameORHandleExists = allPages.filter((page) => {
        return page.name.includes(pageName) || page.handle.includes(pageHandle);
      });

      if (pageNameORHandleExists.length > 0) {
        pageName = `${pageToClone.name} (copy ${pageNameORHandleExists.length})`;
        pageHandle = `${pageToClone.handle}-copy-${pageNameORHandleExists.length}`;
      }

      const newPage = new Page();
      newPage.name = pageName;
      newPage.handle = pageHandle;
      newPage.index = pageToClone.index + 1;
      newPage.appVersionId = appVersionId;

      const clonedpage = await this.pageRepository.save(newPage);

      await this.clonePageEventsAndComponents(pageId, clonedpage.id);

      const pages = await this.findPagesForVersion(appVersionId);
      const events = await this.eventHandlerService.findEventsForVersion(appVersionId);

      return { pages, events };
    }, appVersionId);
  }

  async clonePageEventsAndComponents(pageId: string, clonePageId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pageComponents = await manager.find(Component, { pageId });
      const pageEvents = await this.eventHandlerService.findAllEventsWithSourceId(pageId);
      const componentsIdMap = {};

      // Clone events
      await Promise.all(
        pageEvents.map(async (event) => {
          const eventDefinition = event.event;

          if (eventDefinition?.actionId === 'control-component') {
            eventDefinition.componentId = componentsIdMap[eventDefinition.componentId];
          }

          if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'hide-modal') {
            eventDefinition.modal = componentsIdMap[eventDefinition.modal];
          }

          event.event = eventDefinition;

          const clonedEvent = new EventHandler();
          clonedEvent.event = event.event;
          clonedEvent.index = event.index;
          clonedEvent.name = event.name;
          clonedEvent.sourceId = clonePageId;
          clonedEvent.target = event.target;
          clonedEvent.appVersionId = event.appVersionId;

          await manager.save(EventHandler, clonedEvent);
        })
      );

      // Clone components
      const clonedComponents = await Promise.all(
        pageComponents.map(async (component) => {
          const clonedComponent = { ...component, id: undefined, pageId: clonePageId };
          const newComponent = await manager.save(manager.create(Component, clonedComponent));

          componentsIdMap[component.id] = newComponent.id;
          const componentLayouts = await manager.find(Layout, { componentId: component.id });
          const clonedLayouts = componentLayouts.map((layout) => ({
            ...layout,
            id: undefined,
            componentId: newComponent.id,
          }));

          // Clone component events
          const clonedComponentEvents = await this.eventHandlerService.findAllEventsWithSourceId(component.id);
          const clonedEvents = clonedComponentEvents.map((event) => {
            const eventDefinition = event.event;

            if (eventDefinition?.actionId === 'control-component') {
              eventDefinition.componentId = componentsIdMap[eventDefinition.componentId];
            }

            if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'hide-modal') {
              eventDefinition.modal = componentsIdMap[eventDefinition.modal];
            }

            event.event = eventDefinition;

            const clonedEvent = new EventHandler();
            clonedEvent.event = event.event;
            clonedEvent.index = event.index;
            clonedEvent.name = event.name;
            clonedEvent.sourceId = newComponent.id;
            clonedEvent.target = event.target;
            clonedEvent.appVersionId = event.appVersionId;

            return clonedEvent;
          });

          await manager.save(Layout, clonedLayouts);
          await manager.save(EventHandler, clonedEvents);

          return newComponent;
        })
      );

      const isChildOfTabsOrCalendar = (component, allComponents = [], componentParentId = undefined) => {
        if (componentParentId) {
          const parentId = component?.parent?.split('-').slice(0, -1).join('-');

          const parentComponent = allComponents.find((comp) => comp.id === parentId);

          if (parentComponent) {
            return parentComponent.type === 'Tabs' || parentComponent.type === 'Calendar';
          }
        }

        return false;
      };

      for (const component of clonedComponents) {
        let parentId = component.parent ? component.parent : null;

        const isParentTabOrCalendar = isChildOfTabsOrCalendar(component, pageComponents, parentId);

        if (isParentTabOrCalendar) {
          const childTabId = component.parent.split('-')[component.parent.split('-').length - 1];
          const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
          const mappedParentId = componentsIdMap[_parentId];

          parentId = `${mappedParentId}-${childTabId}`;
        } else {
          parentId = componentsIdMap[parentId];
        }

        if (parentId) {
          await manager.update(Component, component.id, { parent: parentId });
        }
      }
    });
  }

  async updatePage(pageUpdates: UpdatePageDto, appVersionId: string) {
    if (Object.keys(pageUpdates.diff).length > 1) {
      return this.updatePagesOrder(pageUpdates.diff, appVersionId);
    }

    const currentPage = await this.pageRepository.findOne(pageUpdates.pageId);

    if (!currentPage) {
      throw new Error('Page not found');
    }
    return this.pageRepository.update(pageUpdates.pageId, pageUpdates.diff);
  }

  async updatePagesOrder(pages, appVersionId: string) {
    const pagesToPage = Object.keys(pages).map((pageId) => {
      return {
        id: pageId,
        index: pages[pageId].index,
      };
    });

    return await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      await Promise.all(
        pagesToPage.map(async (page) => {
          await manager.update(Page, page.id, page);
        })
      );
    }, appVersionId);
  }

  async deletePage(pageId: string, appVersionId: string) {
    const { editingVersion } = await this.appService.findAppFromVersion(appVersionId);
    return dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const pageExists = await manager.findOne(Page, pageId);

      if (!pageExists) {
        throw new Error('Page not found');
      }

      if (editingVersion?.homePageId === pageId) {
        throw new Error('Cannot delete home page');
      }
      this.eventHandlerService.cascadeDeleteEvents(pageExists.id);
      const pageDeletedIndex = pageExists.index;
      const pageDeleted = await this.pageRepository.delete(pageId);

      if (pageDeleted.affected === 0) {
        throw new Error('Page not deleted');
      }

      const pages = await this.pageRepository.find({ appVersionId: pageExists.appVersionId });

      const rearrangedPages = this.rearrangePagesOnDelete(pages, pageDeletedIndex);

      return await Promise.all(
        rearrangedPages.map(async (page) => {
          await manager.update(Page, page.id, page);
        })
      );
    }, appVersionId);
  }

  rearrangePagesOnDelete(pages: Page[], pageDeletedIndex: number) {
    const rearrangedPages = pages.map((page, index) => {
      if (index + 1 >= pageDeletedIndex) {
        return {
          ...page,
          index: page.index - 1,
        };
      }

      return page;
    });

    return rearrangedPages;
  }
}
