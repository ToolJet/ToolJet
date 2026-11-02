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
