import { Page } from '@entities/page.entity';
import { AppVersion } from '@entities/app_version.entity';
import { EventHandler } from 'src/entities/event_handler.entity';
import { CreatePageDto, UpdatePageDto } from '@modules/apps/dto/page';
import { EntityManager } from 'typeorm';

/**
 * Context interfaces for history capture hooks
 */
export interface PageCreateContext {
  pageData: CreatePageDto;
}

export interface PageUpdateContext {
  pageId: string;
  diff: any;
  oldPageDto: any;
  pageName: string;
}

export interface PageDeleteContext {
  pageId: string;
  pageName: string;
}

export interface PageReorderContext {
  diff: any;
}

export interface IPageService {
  findPagesForVersion(
    appVersionId: string,
    manager?: EntityManager
  ): Promise<Page[]>;
  findOne(id: string): Promise<Page>;
  createPage(page: CreatePageDto, appVersionId: string, organizationId: string): Promise<Page>;
  clonePage(
    pageId: string,
    appVersionId: string,
    organizationId: string
  ): Promise<{ pages: Page[]; events: EventHandler[] }>;
  clonePageEventsAndComponents(pageId: string, clonePageId: string): Promise<void>;
  reorderPages(diff: any, appVersionId: string, organizationId: string): Promise<void>;
  updatePage(pageUpdates: UpdatePageDto, appVersionId: string): Promise<void>;
  deletePage(
    pageId: string,
    appVersionId: string,
    editingVersion: AppVersion,
    deleteAssociatedPages?: boolean,
    organizationId?: string
  ): Promise<void>;
}
