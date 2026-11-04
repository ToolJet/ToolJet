/** @group working */
let options: any;
jest.mock('express-http-proxy', () => (_url, config) => {
  options = config;
  return jest.fn();
});

describe('PostgREST schema cache rejection', () => {
  it('returns a retryable explicit rejection instead of hanging when PostgREST returns an empty error', async () => {
    // Load the proxy with its mock even when app setup already loaded the real service.
    await jest.isolateModulesAsync(async () => {
      const { PostgrestProxyService } = await import('@modules/tooljet-db/services/postgrest-proxy.service');
      const { TooljetDatabaseError } = await import('@modules/tooljet-db/types');
      new PostgrestProxyService({} as any, { get: () => 'http://localhost:3002' } as any, {} as any, {} as any);
      try {
        options.userResDecorator(
          { statusCode: 404 },
          Buffer.from('{}'),
          { headers: { tableInfo: { garden: 'garden' } } },
          {}
        );
        throw new Error('Expected rejection');
      } catch (error) {
        expect(error).toBeInstanceOf(TooljetDatabaseError);
        expect(error.toString()).toContain('schema cache');
      }
    });
  });
});

describe('PostgrestProxyService.perform | transport error', () => {
  // F04: a got error with no `.response` (e.g. ECONNREFUSED) crashed the catch with a TypeError.
  it('should reject with a QueryError when PostgREST cannot be reached', async () => {
    await jest.isolateModulesAsync(async () => {
      const transportError = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3001'), { code: 'ECONNREFUSED' });
      jest.doMock('got', () => ({ __esModule: true, default: jest.fn().mockRejectedValue(transportError) }));
      const { PostgrestProxyService } = await import('@modules/tooljet-db/services/postgrest-proxy.service');
      const { QueryError } = await import('@modules/data-sources/types');
      const service = new PostgrestProxyService(
        {} as any,
        { get: () => 'http://localhost:3001' } as any,
        {} as any,
        {} as any,
        {} as any
      ) as any;
      service.signJwtPayload = jest.fn().mockReturnValue('token');
      service.resolveAndRewrite = jest.fn().mockResolvedValue({ url: '/table-1', tableInfo: {} });

      const failure = await service
        .perform('/api/tooljet-db/proxy/table-1', 'GET', { 'tj-workspace-id': 'org-1' }, {}, undefined)
        .catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(QueryError);
      expect(failure).toMatchObject({ message: 'Query could not be completed' });
    });
  });
});
