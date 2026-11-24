/** @group working */
import { AppEnvironment } from '@entities/app_environments.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { TooljetDbRelationResolverService } from '@modules/tooljet-db/services/relation-resolver.service';
import { EntityManager } from 'typeorm';
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';

jest.mock('express-http-proxy', () => () => jest.fn());

describe('PostgrestProxyService.proxy | TOOLJET_DB_PROXY_LEGACY_COMPAT environment fallback', () => {
  const organizationId = 'org-1';
  const explicitEnvironmentId = '22222222-2222-4222-8222-222222222222';
  const developmentEnvironmentId = '44444444-4444-4444-8444-444444444444';
  const defaultEnvironmentId = '33333333-3333-4333-8333-333333333333';
  const tableId = '11111111-1111-4111-8111-111111111111';

  function buildService(multiEnvironmentLicensed = true) {
    const tableOperationsService = { isRowLimitReached: jest.fn().mockResolvedValue(false) };
    const getLicenseTerms = jest.fn().mockResolvedValue(multiEnvironmentLicensed);
    const licenseTermsService = { getLicenseTerms } as unknown as LicenseTermsService;
    const findOneOrFail = jest.fn(async (_entity, { where }) => {
      const environments = [
        { id: developmentEnvironmentId, organizationId, priority: 1, isDefault: false },
        { id: defaultEnvironmentId, organizationId, priority: 3, isDefault: true },
      ];
      return environments.find((environment) =>
        Object.entries(where).every(([key, value]) => environment[key] === value)
      );
    });
    const relationResolverService = new TooljetDbRelationResolverService(
      { findOneOrFail } as unknown as EntityManager,
      new AppEnvironmentUtilService(licenseTermsService),
      licenseTermsService
    );
    jest.spyOn(relationResolverService, 'defaultEnvironmentIdFor');
    const service = new PostgrestProxyService(
      {} as any,
      { get: () => 'http://localhost:3002' } as any,
      {} as any,
      tableOperationsService as any,
      relationResolverService
    ) as any;
    service.signJwtPayload = jest.fn().mockReturnValue('token');
    service.replaceTableNamesAtPlaceholder = jest.fn(async (url: string) => url);
    service.validateJSONBInputs = jest.fn().mockResolvedValue({});
    service.httpProxy = jest.fn();
    service.resolveAndRewrite = jest.fn().mockResolvedValue({ url: `/${tableId}`, tableInfo: {} });
    return { service, relationResolverService, getLicenseTerms, findOneOrFail };
  }

  const request = (query = '') => ({
    method: 'GET',
    url: `/api/tooljet-db/proxy/${tableId}${query}`,
    headers: { 'tj-workspace-id': organizationId },
    body: {},
  });

  afterEach(() => {
    delete process.env.TOOLJET_DB_PROXY_LEGACY_COMPAT;
  });

  it('should leave a call without environment_id unresolved when the flag is off', async () => {
    const { service, relationResolverService } = buildService();

    await service.proxy(request(), { set: jest.fn() }, jest.fn());

    expect(relationResolverService.defaultEnvironmentIdFor).not.toHaveBeenCalled();
    expect(service.resolveAndRewrite).toHaveBeenCalledWith(expect.any(String), organizationId, undefined, true);
  });

  it.each([
    { licensed: true, environmentId: defaultEnvironmentId, criteria: { isDefault: true } },
    { licensed: false, environmentId: developmentEnvironmentId, criteria: { priority: 1 } },
  ])('resolves an omitted environment with multi-environment licence = $licensed', async ({
    licensed,
    environmentId,
    criteria,
  }) => {
    process.env.TOOLJET_DB_PROXY_LEGACY_COMPAT = 'true';
    const { service, getLicenseTerms, findOneOrFail } = buildService(licensed);

    await service.proxy(request(), { set: jest.fn() }, jest.fn());

    expect(getLicenseTerms).toHaveBeenCalledWith(LICENSE_FIELD.MULTI_ENVIRONMENT, organizationId);
    expect(findOneOrFail).toHaveBeenCalledWith(AppEnvironment, { where: { organizationId, ...criteria } });
    expect(service.resolveAndRewrite).toHaveBeenCalledWith(expect.any(String), organizationId, environmentId, true);
  });

  it('should keep an explicit environment_id when the flag is on', async () => {
    process.env.TOOLJET_DB_PROXY_LEGACY_COMPAT = 'true';
    const { service, relationResolverService } = buildService();

    await service.proxy(request(`?environment_id=${explicitEnvironmentId}`), { set: jest.fn() }, jest.fn());

    expect(relationResolverService.defaultEnvironmentIdFor).not.toHaveBeenCalled();
    expect(service.resolveAndRewrite).toHaveBeenCalledWith(
      expect.any(String),
      organizationId,
      explicitEnvironmentId,
      true
    );
  });
});
