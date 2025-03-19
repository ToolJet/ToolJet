import { Page } from 'src/entities/page.entity';
import { EntityManager } from 'typeorm';
import { CreatePageDto } from '@modules/apps/dto/page';
export interface IPageHelperService {
  fetchPages(appVersionId: string): Promise<Page[]>;
  reorderPages(udpateObject: any, appVersionId: string): Promise<void>;
  deletePageGroup(page: Page, appVersionId: string, deleteAssociatedPages: boolean): Promise<void>;
  rearrangePagesOrderPostDeletion(pageDeleted: Page, manager: EntityManager): Promise<void>;
  preparePageObject(dto: CreatePageDto, appVersionId: string): Promise<Page>;
}
