import { Page } from 'src/entities/page.entity';
import { EntityManager } from 'typeorm';
import { CreatePageDto } from '@modules/apps/dto/page';
export interface IPageHelperService {
  fetchPages(appVersionId: string, manager?: EntityManager): Promise<Page[]>;
  reorderPages(udpateObject: any, appVersionId: string, organizationId: string): Promise<void>;
  deletePageGroup(
    page: Page,
    appVersionId: string,
    deleteAssociatedPages: boolean,
    organizationId: string
  ): Promise<void>;
  rearrangePagesOrderPostDeletion(pageDeleted: Page, manager: EntityManager, organizationId: string): Promise<void>;
  preparePageObject(dto: CreatePageDto, appVersionId: string, organizationId: string): Promise<Page>;
}
