/** @group working */
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';

jest.mock('express-http-proxy', () => () => jest.fn());

describe('PostgrestProxyService.proxy | TOOLJET_DB_PROXY_LEGACY_COMPAT environment fallback', () => {
  const organizationId = 'org-1';
  const explicitEnvironmentId = '22222222-2222-4222-8222-222222222222';
  const defaultEnvironmentId = '33333333-3333-4333-8333-333333333333';
  const tableId = '11111111-1111-4111-8111-111111111111';

  function buildService() {
    const tableOperationsService = { isRowLimitReached: jest.fn().mockResolvedValue(false) };
    const relationResolverService = { defaultEnvironmentIdFor: jest.fn().mockResolvedValue(defaultEnvironmentId) };
    const service = new PostgrestProxyService(
      {} as any,
      { get: () => 'http://localhost:3002' } as any,
      {} as any,
      tableOperationsService as any,
      relationResolverService as any
    ) as any;
    service.signJwtPayload = jest.fn().mockReturnValue('token');
    service.replaceTableNamesAtPlaceholder = jest.fn(async (url: string) => url);
    service.validateJSONBInputs = jest.fn().mockResolvedValue({});
    service.httpProxy = jest.fn();
    service.resolveAndRewrite = jest.fn().mockResolvedValue({ url: `/${tableId}`, tableInfo: {} });
    return { service, relationResolverService };
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

  it('should read the default environment for a call without environment_id when the flag is on', async () => {
    process.env.TOOLJET_DB_PROXY_LEGACY_COMPAT = 'true';
    const { service, relationResolverService } = buildService();

    await service.proxy(request(), { set: jest.fn() }, jest.fn());

    expect(relationResolverService.defaultEnvironmentIdFor).toHaveBeenCalledWith(organizationId);
    expect(service.resolveAndRewrite).toHaveBeenCalledWith(
      expect.any(String),
      organizationId,
      defaultEnvironmentId,
      true
    );
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
