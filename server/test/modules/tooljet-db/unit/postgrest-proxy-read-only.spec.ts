/** @group working */
import { PostgrestProxyService } from '@modules/tooljet-db/services/postgrest-proxy.service';

jest.mock('express-http-proxy', () => () => jest.fn());

describe('PostgrestProxyService.proxy | read-only resolution', () => {
  const organizationId = 'org-1';
  const environmentId = '22222222-2222-4222-8222-222222222222';
  const tableId = '11111111-1111-4111-8111-111111111111';

  function buildService() {
    const tableOperationsService = { isRowLimitReached: jest.fn().mockResolvedValue(false) };
    const service = new PostgrestProxyService(
      {} as any,
      { get: () => 'http://localhost:3002' } as any,
      {} as any,
      tableOperationsService as any,
      {} as any
    ) as any;
    service.signJwtPayload = jest.fn().mockReturnValue('token');
    service.replaceTableNamesAtPlaceholder = jest.fn(async (url: string) => url);
    service.validateJSONBInputs = jest.fn().mockResolvedValue({});
    service.httpProxy = jest.fn();
    service.resolveAndRewrite = jest.fn().mockResolvedValue({ url: `/${tableId}`, tableInfo: {} });
    return service;
  }

  const request = (method: string) => ({
    method,
    url: `/api/tooljet-db/proxy/${tableId}?environment_id=${environmentId}`,
    headers: { 'tj-workspace-id': organizationId },
    body: {},
  });

  it.each(['GET', 'HEAD'])('should resolve a %s request as read-only', async (method) => {
    const service = buildService();

    await service.proxy(request(method), { set: jest.fn() }, jest.fn());

    expect(service.resolveAndRewrite).toHaveBeenCalledWith(expect.any(String), organizationId, environmentId, true);
  });

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])('should not resolve a %s request as read-only', async (method) => {
    const service = buildService();

    await service.proxy(request(method), { set: jest.fn() }, jest.fn());

    expect(service.resolveAndRewrite).toHaveBeenCalledWith(expect.any(String), organizationId, environmentId, false);
  });
});
