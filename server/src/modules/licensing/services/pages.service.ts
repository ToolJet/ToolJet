import { EntityManager, In } from 'typeorm';
import { Page } from '@entities/page.entity';
import { LicenseCountsService } from './count.service';
import { LICENSE_FIELD, LICENSE_LIMIT, LICENSE_LIMITS_LABEL } from '@modules/licensing/constants';
import { HttpException, Injectable } from '@nestjs/common';
import { LicenseTermsService } from '../interfaces/IService';
import { LicensePageService as ILicensePageService } from '../interfaces/IService';
import { dbTransactionWrap } from '@helpers/database.helper';
import { generatePayloadForLimits } from '../helper';

type OrderablePage = Pick<Page, 'id' | 'index' | 'pageGroupIndex' | 'isPageGroup' | 'pageGroupId'>;

const byPageOrder = (a: OrderablePage, b: OrderablePage) =>
  a.index - b.index || (a.pageGroupIndex ?? Number.MAX_SAFE_INTEGER) - (b.pageGroupIndex ?? Number.MAX_SAFE_INTEGER);

// Pages and page groups past their limits, in page order, plus every page inside a disabled group.
// The home page and the group holding it are always kept, and take one of the slots.
function selectPageIdsOverLimit(
  pages: OrderablePage[],
  limits: { pages?: number; groups?: number },
  homePageId?: string | null
): string[] {
  const homePage = pages.find((page) => page.id === homePageId);
  const keepFirst = (ordered: OrderablePage[], limit: number, mustKeepId?: string | null): Set<string> => {
    const kept = new Set<string>();
    if (mustKeepId && ordered.some((page) => page.id === mustKeepId)) kept.add(mustKeepId);
    for (const page of ordered) {
      if (kept.size >= limit) break;
      kept.add(page.id);
    }
    return kept;
  };

  const toDisable = new Set<string>();
  const regularPages = pages.filter((page) => !page.isPageGroup).sort(byPageOrder);
  if (typeof limits.pages === 'number') {
    const kept = keepFirst(regularPages, limits.pages, homePage?.id);
    regularPages.filter((page) => !kept.has(page.id)).forEach((page) => toDisable.add(page.id));
  }

  const groups = pages.filter((page) => page.isPageGroup).sort(byPageOrder);
  if (typeof limits.groups === 'number') {
    const kept = keepFirst(groups, limits.groups, homePage?.pageGroupId);
    const disabledGroupIds = new Set(groups.filter((group) => !kept.has(group.id)).map((group) => group.id));
    disabledGroupIds.forEach((id) => toDisable.add(id));
    regularPages
      .filter((page) => page.pageGroupId && disabledGroupIds.has(page.pageGroupId))
      .forEach((page) => toDisable.add(page.id));
  }
  return [...toDisable];
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

  async disablePagesOverLimit(
    manager: EntityManager,
    appVersionId: string,
    organizationId: string,
    homePageId?: string | null
  ): Promise<void> {
    const terms = await this.licenseTermsService.getLicenseTerms(
      [LICENSE_FIELD.APP_PAGES_LIMIT, LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT],
      organizationId
    );
    const pagesLimit = terms[LICENSE_FIELD.APP_PAGES_LIMIT];
    const groupsLimit = terms[LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT];
    if (typeof pagesLimit !== 'number' && typeof groupsLimit !== 'number') {
      return;
    }

    const pages = await manager.find(Page, {
      select: ['id', 'index', 'pageGroupIndex', 'isPageGroup', 'pageGroupId', 'disabled'],
      where: { appVersionId },
    });
    const alreadyDisabled = new Set(pages.filter((page) => page.disabled).map((page) => page.id));
    const idsToDisable = selectPageIdsOverLimit(
      pages,
      {
        pages: typeof pagesLimit === 'number' ? pagesLimit : undefined,
        groups: typeof groupsLimit === 'number' ? groupsLimit : undefined,
      },
      homePageId
    ).filter((id) => !alreadyDisabled.has(id));
    if (idsToDisable.length) {
      await manager.update(Page, { id: In(idsToDisable) }, { disabled: true });
    }
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
