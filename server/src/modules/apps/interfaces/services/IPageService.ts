import { Page } from "@entities/page.entity";
import { AppVersion } from "@entities/app_version.entity";
import { EventHandler } from "src/entities/event_handler.entity";
import { CreatePageDto, UpdatePageDto } from "@modules/apps/dto/page";
import { EntityManager } from "typeorm";

export interface DeletePageOptions {
  /** Skip app history tracking (useful for bulk AI operations) */
  skipHistoryCapture?: boolean;
  /** Skip page reordering after deletion (useful when deleting multiple pages) */
  skipReorder?: boolean;
  /** Delete associated pages when deleting a page group */
  deleteAssociatedPages?: boolean;
}

export interface IPageService {
  findPagesForVersion(
    appVersionId: string,
    manager?: EntityManager
  ): Promise<Page[]>;
  findOne(id: string): Promise<Page>;
  createPage(
    page: CreatePageDto,
    appVersionId: string,
    organizationId: string
  ): Promise<Page>;
  clonePage(
    pageId: string,
    appVersionId: string,
    organizationId: string
  ): Promise<{ pages: Page[]; events: EventHandler[] }>;
  clonePageEventsAndComponents(
    pageId: string,
    clonePageId: string
  ): Promise<void>;
  reorderPages(
    diff: any,
    appVersionId: string,
    organizationId: string
  ): Promise<void>;
  updatePage(pageUpdates: UpdatePageDto, appVersionId: string): Promise<void>;
  deletePage(
    pageId: string,
    appVersionId: string,
    editingVersion: AppVersion,
    deleteAssociatedPages?: boolean,
    organizationId?: string
  ): Promise<void>;
  /**
   * Delete a page using an existing EntityManager (for use within transactions).
   * This method is intended for internal use by services that already have a transaction context.
   * @param pageId - The ID of the page to delete
   * @param manager - The EntityManager to use for the deletion
   * @param organizationId - The organization ID for license validation
   * @param options - Optional deletion options
   */
  deletePageWithManager(
    pageId: string,
    manager: EntityManager,
    organizationId: string,
    options?: DeletePageOptions
  ): Promise<void>;
}
