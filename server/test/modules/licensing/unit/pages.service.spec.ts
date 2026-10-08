/**
 * Unit tests for LicensePageService — the licensable page/page-group count-limit logic.
 *
 * validatePages runs post-insert inside the same DB transaction that creates the page (see
 * PageService.createPage): the strict `>` comparison (rather than `>=`) is intentional, since the
 * just-inserted row is already counted by the time this check runs.
 */

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => {
    return cb(manager ?? {});
  }),
}));

import { LicensePageService } from '../../../../src/modules/licensing/services/pages.service';
import { LICENSE_FIELD } from '../../../../src/modules/licensing/constants';

function makeService(opts: { getLicenseTerms?: jest.Mock; licenseCountsService?: Record<string, jest.Mock> }) {
  const licenseTermsService = { getLicenseTerms: opts.getLicenseTerms ?? jest.fn() } as any;
  const licenseCountsService = {
    fetchTotalPagesCount: jest.fn(),
    fetchTotalPageGroupsCount: jest.fn(),
    fetchMaxPagesCount: jest.fn(),
    fetchMaxPageGroupsCount: jest.fn(),
    ...opts.licenseCountsService,
  } as any;
  return { service: new LicensePageService(licenseTermsService, licenseCountsService), licenseCountsService };
}

const appVersionId = 'app-version-uuid-1';
const organizationId = 'org-uuid-1';

describe('LicensePageService.validatePages', () => {
  it('skips the check when the limit is not a number (unlimited/basic plan)', async () => {
    const { service, licenseCountsService } = makeService({ getLicenseTerms: jest.fn().mockResolvedValue('') });

    await expect(service.validatePages({} as any, appVersionId, organizationId, false)).resolves.toBeUndefined();
    expect(licenseCountsService.fetchTotalPagesCount).not.toHaveBeenCalled();
  });

  it('allows the request when the count equals the limit, and throws once it is exceeded', async () => {
    const { service } = makeService({
      getLicenseTerms: jest.fn().mockResolvedValue(10),
      licenseCountsService: { fetchTotalPagesCount: jest.fn().mockResolvedValue(10) },
    });
    await expect(service.validatePages({} as any, appVersionId, organizationId, false)).resolves.toBeUndefined();

    const { service: overLimitService } = makeService({
      getLicenseTerms: jest.fn().mockResolvedValue(10),
      licenseCountsService: { fetchTotalPagesCount: jest.fn().mockResolvedValue(11) },
    });
    await expect(overLimitService.validatePages({} as any, appVersionId, organizationId, false)).rejects.toMatchObject({
      status: 451,
    });
  });

  it('checks page-groups against their own limit/count when isPageGroup is true', async () => {
    const { service } = makeService({
      getLicenseTerms: jest.fn().mockResolvedValue(5),
      licenseCountsService: { fetchTotalPageGroupsCount: jest.fn().mockResolvedValue(6) },
    });

    await expect(service.validatePages({} as any, appVersionId, organizationId, true)).rejects.toMatchObject({
      status: 451,
    });
  });
});

describe('LicensePageService.getPagesLimit', () => {
  it('computes a percentage-based payload when the limit is numeric', async () => {
    const getLicenseTerms = jest.fn().mockResolvedValue({
      [LICENSE_FIELD.APP_PAGES_LIMIT]: 10,
      [LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT]: 5,
      [LICENSE_FIELD.STATUS]: { isExpired: false },
    });
    const { service } = makeService({
      getLicenseTerms,
      licenseCountsService: {
        fetchMaxPagesCount: jest.fn().mockResolvedValue(3),
        fetchMaxPageGroupsCount: jest.fn().mockResolvedValue(2),
      },
    });

    const result = await service.getPagesLimit(organizationId);

    expect(result.pagesCount).toMatchObject({ current: 3, total: 10, canAddUnlimited: false });
    expect(result.pageGroupsCount).toMatchObject({ current: 2, total: 5, canAddUnlimited: false });
  });

  it('reports unlimited without querying counts when the limit is not numeric', async () => {
    const getLicenseTerms = jest.fn().mockResolvedValue({
      [LICENSE_FIELD.APP_PAGES_LIMIT]: '',
      [LICENSE_FIELD.APP_PAGE_GROUPS_LIMIT]: '',
      [LICENSE_FIELD.STATUS]: { isExpired: false },
    });
    const { service, licenseCountsService } = makeService({ getLicenseTerms });

    const result = await service.getPagesLimit(organizationId);

    expect(result.pagesCount).toMatchObject({ canAddUnlimited: true });
    expect(licenseCountsService.fetchMaxPagesCount).not.toHaveBeenCalled();
  });
});
