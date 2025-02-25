import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { Injectable } from '@nestjs/common';
import { EventsService } from './event.service';
import { Page } from 'src/entities/page.entity';
import { dbTransactionForAppVersionAssociationsUpdate, dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { CreatePageDto } from '../dto/page';
import { IPageHelperService } from '../interfaces/services/IPageUtilService';

@Injectable()
export class PageHelperService implements IPageHelperService {
  constructor(protected eventHandlerService: EventsService, protected licenseTermsService: LicenseTermsService) {}

  public async fetchPages(appVersionId: string): Promise<Page[]> {
    let allPages = [];
    return await dbTransactionWrap(async (manager: EntityManager) => {
      allPages = await manager.find(Page, {
        where: {
          appVersionId,
          isPageGroup: false,
        },
        order: {
          index: 'ASC',
        },
      });

      return allPages;
    });
  }

  public async reorderPages(udpateObject, appVersionId: string): Promise<void> {
    await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const updateArr = [];
      const diff = udpateObject.diff;
      Object.keys(diff).forEach((pageId) => {
        const index = diff[pageId].index;
        updateArr.push(manager.update(Page, pageId, { index }));
      });
      await Promise.all(updateArr);
    }, appVersionId);
  }

  public async rearrangePagesOrderPostDeletion(pageDeleted: Page, manager: EntityManager): Promise<void> {
    const appVersionId = pageDeleted.appVersionId;
    // if user is not licensed, then just update the index of the pages
    await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const pages = await manager.find(Page, {
        where: {
          appVersionId: pageDeleted.appVersionId,
          isPageGroup: false,
        },
        order: {
          index: 'ASC',
        },
      });
      const updateArr = [];
      pages.forEach((page, index) => {
        updateArr.push(
          manager.update(Page, page.id, {
            index,
          })
        );
      });
      await Promise.all(updateArr);
    }, appVersionId);
  }

  public async deletePageGroup(page: Page, appVersionId: string, deleteAssociatedPages: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async preparePageObject(dto: CreatePageDto, appVersionId: string): Promise<Page> {
    const page = new Page();
    page.id = dto.id;
    page.name = dto.name;
    page.handle = dto.handle;
    page.appVersionId = appVersionId;
    page.autoComputeLayout = true;
    page.index = dto.index;
    return page;
  }
}
