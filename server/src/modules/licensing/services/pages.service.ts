import { EntityManager, In } from 'typeorm';
import { Page } from '@entities/page.entity';
import { AppVersion } from '@entities/app_version.entity';
import { LicenseCountsService } from './count.service';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '@modules/licensing/constants';
import { HttpException, Injectable } from '@nestjs/common';
import { LicenseTermsService } from '../interfaces/IService';
import { LicensePageService as ILicensePageService } from '../interfaces/IService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { generatePayloadForLimits } from '../helper';

type OrderablePage = Pick<Page, 'id' | 'index' | 'pageGroupIndex' | 'isPageGroup'>;

// Pages past the page limit, in page order. The home page is always kept and takes one of the slots.
function selectPageIdsOverLimit(pages: OrderablePage[], pagesLimit: number, homePageId?: string | null): string[] {
  const orderedPages = pages
    .filter((page) => !page.isPageGroup)
    .sort(
      (a, b) =>
        a.index - b.index ||
        (a.pageGroupIndex ?? Number.MAX_SAFE_INTEGER) - (b.pageGroupIndex ?? Number.MAX_SAFE_INTEGER)
    );
  if (orderedPages.length <= pagesLimit) {
    return [];
  }

  const keptPageIds = new Set<string>();
  if (homePageId && orderedPages.some((page) => page.id === homePageId)) {
    keptPageIds.add(homePageId);
  }
  for (const page of orderedPages) {
    if (keptPageIds.size >= pagesLimit) break;
    keptPageIds.add(page.id);
  }
  return orderedPages.filter((page) => !keptPageIds.has(page.id)).map((page) => page.id);
}

@Injectable()
export class LicensePageService extends ILicensePageService {
  constructor(
    protected readonly licenseTermsService: LicenseTermsService,
    protected readonly licenseCountsService: LicenseCountsService
  ) {
    super();
  }

  async validatePages(
    manager: EntityManager,
    appVersionId: string,
    organizationId: string,
    isPageGroup: boolean
  ): Promise<void> {
    if (isPageGroup) {
      const pageGroupsLimit = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT,
        organizationId
      );
      if (typeof pageGroupsLimit !== 'number') {
        return;
      }
      const pageGroupsCount = await this.licenseCountsService.fetchTotalPageGroupsCount(appVersionId, manager);
      if (pageGroupsCount > pageGroupsLimit) {
        throw new HttpException('You have reached your limit for number of page groups.', 451);
      }
      return;
    }

    const pagesLimit = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_PAGES_LIMIT, organizationId);
    if (typeof pagesLimit !== 'number') {
      return;
    }
    const pagesCount = await this.licenseCountsService.fetchTotalPagesCount(appVersionId, manager);
    if (pagesCount > pagesLimit) {
      throw new HttpException('You have reached your limit for number of pages.', 451);
    }
  }

  // An import can bring in more pages than the plan allows. Instead of rejecting it, pages past the limit
  // (in page order) are disabled. The home page always stays enabled and takes one of the slots.
  async disablePagesOverLimit(
    manager: EntityManager,
    appVersionId: string,
    organizationId: string,
    homePageId?: string | null
  ): Promise<void> {
    const pagesLimit = await this.licenseTermsService.getLicenseTerms(LICENSE_FIELD.APP_PAGES_LIMIT, organizationId);
    if (typeof pagesLimit !== 'number') {
      return;
    }

    const pages = await manager.find(Page, {
      select: ['id', 'index', 'pageGroupIndex', 'isPageGroup', 'disabled'],
      where: { appVersionId },
    });
    const alreadyDisabledIds = new Set(pages.filter((page) => page.disabled).map((page) => page.id));
    const pageIdsToDisable = selectPageIdsOverLimit(pages, pagesLimit, homePageId).filter(
      (id) => !alreadyDisabledIds.has(id)
    );
    if (pageIdsToDisable.length) {
      await manager.update(Page, { id: In(pageIdsToDisable) }, { disabled: true });
    }
  }

  async applyPagesLimit<T extends OrderablePage & { disabled: boolean }>(
    pages: T[],
    appVersionId: string,
    manager?: EntityManager
  ): Promise<T[]> {
    if (!pages.some((page) => !page.isPageGroup)) {
      return pages;
    }

    return dbTransactionWrap(async (manager: EntityManager) => {
      const appVersion = await manager
        .createQueryBuilder(AppVersion, 'appVersion')
        .innerJoin('appVersion.app', 'app')
        .select('appVersion.homePageId', 'homePageId')
        .addSelect('app.organizationId', 'organizationId')
        .where('appVersion.id = :appVersionId', { appVersionId })
        .getRawOne<{ homePageId: string | null; organizationId: string }>();
      if (!appVersion) {
        return pages;
      }

      const pagesLimit = await this.licenseTermsService.getLicenseTerms(
        LICENSE_FIELD.APP_PAGES_LIMIT,
        appVersion.organizationId
      );
      if (typeof pagesLimit !== 'number') {
        return pages;
      }

      const overLimitIds = new Set(selectPageIdsOverLimit(pages, pagesLimit, appVersion.homePageId));
      if (!overLimitIds.size) {
        return pages;
      }
      return pages.map((page) => (overLimitIds.has(page.id) ? { ...page, disabled: true } : page));
    }, manager);
  }

  async getPagesLimit(organizationId: string): Promise<any> {
    const licenseTerms = await this.licenseTermsService.getLicenseTerms(
      [
        LICENSE_FIELD.APP_PAGES_LIMIT,
        LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT,
        LICENSE_FIELD.APP_PAGES_NAV_GROUP,
        LICENSE_FIELD.STATUS,
      ],
      organizationId
    );
    const pagesLimit = licenseTerms[LICENSE_FIELD.APP_PAGES_LIMIT];
    const pageGroupsLimit = licenseTerms[LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT];
    const hasPageGroups = !!licenseTerms[LICENSE_FIELD.APP_PAGES_NAV_GROUP];
    const licenseStatus = licenseTerms[LICENSE_FIELD.STATUS];

    return await dbTransactionWrap(async (manager: EntityManager) => {
      return {
        pagesCount: generatePayloadForLimits(
          typeof pagesLimit === 'number'
            ? await this.licenseCountsService.fetchMaxPagesCount(organizationId, manager)
            : 0,
          typeof pagesLimit === 'number' ? pagesLimit : LICENSE_LIMIT.UNLIMITED,
          licenseStatus,
          LICENSE_LIMITS_LABEL.PAGES
        ),
        pageGroupsCount: hasPageGroups
          ? generatePayloadForLimits(
              typeof pageGroupsLimit === 'number'
                ? await this.licenseCountsService.fetchMaxPageGroupsCount(organizationId, manager)
                : 0,
              typeof pageGroupsLimit === 'number' ? pageGroupsLimit : LICENSE_LIMIT.UNLIMITED,
              licenseStatus,
              LICENSE_LIMITS_LABEL.PAGE_GROUPS
            )
          : null,
      };
    });
  }
}
