import FirecrawlQueryService from '../lib/index';
import { SourceOptions } from '../lib/types';

// These cover the guards around the configurable API origin. Every case below
// resolves without a network call: raw IPs skip DNS resolution and `localhost`
// is on the self-hosted allowlist.
describe('getConnection', () => {
  const service = new FirecrawlQueryService();
  const source = (options: Partial<SourceOptions>): SourceOptions => options as SourceOptions;
  const edition = process.env.TOOLJET_EDITION;

  afterEach(() => {
    if (edition === undefined) delete process.env.TOOLJET_EDITION;
    else process.env.TOOLJET_EDITION = edition;
  });

  it('connects to Firecrawl Cloud with just an API key', async () => {
    await expect(service.getConnection(source({ apiKey: 'fc-test' }))).resolves.toBeDefined();
  });

  it('requires an API key when no custom API URL is set', async () => {
    // A QueryError carries the summary as its message and the detail separately.
    await expect(service.getConnection(source({}))).rejects.toMatchObject({
      message: 'API key missing',
      description: 'No Firecrawl API key provided in source options',
    });
  });

  it('allows a keyless self-hosted instance', async () => {
    await expect(service.getConnection(source({ apiUrl: 'http://localhost:3002' }))).resolves.toBeDefined();
  });

  it('allows a self-hosted instance on a private network', async () => {
    await expect(service.getConnection(source({ apiUrl: 'http://192.168.1.10:3002' }))).resolves.toBeDefined();
  });

  it('refuses a custom API URL on ToolJet Cloud', async () => {
    process.env.TOOLJET_EDITION = 'cloud';

    await expect(
      service.getConnection(source({ apiKey: 'fc-test', apiUrl: 'http://192.168.1.10:3002' }))
    ).rejects.toMatchObject({
      message: 'Custom API URL not allowed',
      description: expect.stringContaining('only supported on self-hosted ToolJet'),
    });
  });

  it('blocks the cloud metadata endpoint even when self-hosted', async () => {
    await expect(service.getConnection(source({ apiUrl: 'http://169.254.169.254' }))).rejects.toThrow(
      'Private IP address blocked'
    );
  });

  it('blocks a loopback address even when self-hosted', async () => {
    await expect(service.getConnection(source({ apiUrl: 'http://127.0.0.1:3002' }))).rejects.toThrow(
      'Private IP address blocked'
    );
  });

  it('blocks a dangerous scheme', async () => {
    await expect(service.getConnection(source({ apiUrl: 'file:///etc/passwd' }))).rejects.toThrow(
      'URL scheme blocked'
    );
  });

  it('rejects a malformed API URL', async () => {
    await expect(service.getConnection(source({ apiUrl: 'not-a-url' }))).rejects.toThrow('Invalid URL format');
  });
});
