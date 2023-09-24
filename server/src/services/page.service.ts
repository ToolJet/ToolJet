import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Page } from 'src/entities/page.entity';
import { ComponentsService } from './components.service';
import { CreatePageDto, UpdatePageDto } from '@dto/pages.dto';
import { AppsService } from './apps.service';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
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
    const newPage = new Page();
    newPage.id = page.id;
    newPage.name = page.name;
    newPage.handle = page.handle;
    newPage.index = page.index;
    newPage.appVersionId = appVersionId;

    return this.pageRepository.save(newPage);
  }

  async clonePage(pageId: string, appVersionId: string) {
    const pageToClone = await this.pageRepository.findOne(pageId);

    if (!pageToClone) {
      throw new Error('Page not found');
    }

    const newPage = new Page();
    newPage.name = `${pageToClone.name} copy`;
    newPage.handle = `${pageToClone.handle}-copy`;
    newPage.index = pageToClone.index + 1;
    newPage.appVersionId = appVersionId;

    const clonedpage = await this.pageRepository.save(newPage);

    await this.clonePageEventsAndComponents(pageId, clonedpage.id, appVersionId);

    const pages = await this.findPagesForVersion(appVersionId);
    const events = await this.eventHandlerService.findEventsForVersion(appVersionId);

    return { pages, events };
  }

  async clonePageEventsAndComponents(pageId: string, clonePageId: string, appVersionId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pageComponents = await manager.find(Component, { pageId });
      const pageEvents = await this.eventHandlerService.findAllEventsWithSourceId(pageId);

      // Clone events
      await Promise.all(
        pageEvents.map(async (event) => {
          const clonedEvent = { ...event, id: undefined, sourceId: clonePageId };
          await manager.save(EventHandler, clonedEvent);
        })
      );

      // Clone components
      const clonedComponents = await Promise.all(
        pageComponents.map(async (component) => {
          const clonedComponent = { ...component, id: undefined, pageId: clonePageId };
          const newComponent = await manager.save(Component, clonedComponent);

          const componentLayouts = await manager.find(Layout, { componentId: component.id });
          const clonedLayouts = componentLayouts.map((layout) => ({
            ...layout,
            id: undefined,
            componentId: newComponent.id,
          }));

          // Clone component events
          const clonedComponentEvents = await this.eventHandlerService.findAllEventsWithSourceId(component.id);
          const clonedEvents = clonedComponentEvents.map((event) => ({
            ...event,
            id: undefined,
            sourceId: newComponent.id,
          }));

          await manager.save(Layout, clonedLayouts);
          await manager.save(EventHandler, clonedEvents);

          return newComponent;
        })
      );

      return clonedComponents;
    });
  }

  async updatePage(pageUpdates: UpdatePageDto) {
    if (Object.keys(pageUpdates.diff).length > 1) {
      return this.updatePagesOrder(pageUpdates.diff);
    }

    const currentPage = await this.pageRepository.findOne(pageUpdates.pageId);

    if (!currentPage) {
      throw new Error('Page not found');
    }
    return this.pageRepository.update(pageUpdates.pageId, pageUpdates.diff);
  }

  async updatePagesOrder(pages) {
    const pagesToPage = Object.keys(pages).map((pageId) => {
      return {
        id: pageId,
        index: pages[pageId].index,
      };
    });

    return await dbTransactionWrap(async (manager: EntityManager) => {
      await Promise.all(
        pagesToPage.map(async (page) => {
          await manager.update(Page, page.id, page);
        })
      );
    });
  }

  async deletePage(pageId: string, appVersionId: string) {
    const { editingVersion } = await this.appService.findAppFromVersion(appVersionId);
    return dbTransactionWrap(async (manager: EntityManager) => {
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
    });
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
