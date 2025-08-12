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
  constructor(
    protected eventHandlerService: EventsService,
    protected licenseTermsService: LicenseTermsService
  ) {}

  public async fetchPages(appVersionId: string, manager?: EntityManager): Promise<Page[]> {
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
    }, manager);
  }

  public async reorderPages(udpateObject, appVersionId: string, organizationId: string): Promise<void> {
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

  public async rearrangePagesOrderPostDeletion(
    pageDeleted: Page,
    manager: EntityManager,
    organizationId: string
  ): Promise<void> {
    // Use the existing manager to avoid nested transactions
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
    for (let i = 0; i < pages.length; i++) {
      updateArr.push(
        manager.update(Page, pages[i].id, {
          index: i,
        })
      );
    }
    await Promise.all(updateArr);
  }

  public async deletePageGroup(
    page: Page,
    appVersionId: string,
    deleteAssociatedPages: boolean,
    organizationId: string
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async preparePageObject(dto: CreatePageDto, appVersionId: string, organizationId: string): Promise<Page> {
    const page = new Page();
    page.id = dto.id;
    page.name = dto.name;
    page.handle = dto.handle;
    page.appVersionId = appVersionId;
    page.autoComputeLayout = true;
    page.index = dto.index;
    page.appId = dto.appId;
    page.url = dto.url;
    page.type = dto.type;
    page.openIn = dto.openIn;
    return page;
  }

  public async findModuleContainer(appVersionId: string, organizationId: string): Promise<void> {
    return null;
  }
}
