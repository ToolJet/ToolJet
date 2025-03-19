import { Page } from '@entities/page.entity';
import { AppVersion } from '@entities/app_version.entity';
import { EventHandler } from 'src/entities/event_handler.entity';
import { CreatePageDto, UpdatePageDto } from '@modules/apps/dto/page';

export interface IPageService {
  findPagesForVersion(appVersionId: string): Promise<Page[]>;
  findOne(id: string): Promise<Page>;
  createPage(page: CreatePageDto, appVersionId: string): Promise<Page>;
  clonePage(pageId: string, appVersionId: string): Promise<{ pages: Page[]; events: EventHandler[] }>;
  clonePageEventsAndComponents(pageId: string, clonePageId: string): Promise<void>;
  reorderPages(diff: any, appVersionId: string): Promise<void>;
  updatePage(pageUpdates: UpdatePageDto, appVersionId: string): Promise<void>;
  deletePage(
    pageId: string,
    appVersionId: string,
    editingVersion: AppVersion,
    deleteAssociatedPages?: boolean
  ): Promise<void>;
}
