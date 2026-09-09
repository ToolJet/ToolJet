import Firecrawl from 'firecrawl';
import { scrape, search, map, startCrawl, getCrawlStatus } from '../lib/query_operations';
import { Operation, QueryOptions } from '../lib/types';

// The operations are thin wrappers, so the client is stubbed and the assertions
// are about what gets handed to the SDK.
const stubClient = () =>
  ({
    scrape: jest.fn().mockResolvedValue({}),
    search: jest.fn().mockResolvedValue({}),
    map: jest.fn().mockResolvedValue({}),
    startCrawl: jest.fn().mockResolvedValue({}),
    getCrawlStatus: jest.fn().mockResolvedValue({}),
  } as unknown as Firecrawl);

const query = (options: Partial<QueryOptions>): QueryOptions =>
  ({ operation: Operation.Scrape, ...options } as QueryOptions);

describe('scrape', () => {
  it('defaults to markdown when no format is given', async () => {
    const client = stubClient();

    await scrape(client, query({ url: 'https://example.com' }));

    expect(client.scrape).toHaveBeenCalledWith('https://example.com', { formats: ['markdown'] });
  });

  it('passes through explicit formats and options', async () => {
    const client = stubClient();

    await scrape(
      client,
      query({ url: 'https://example.com', formats: '["html"]', options: '{ "onlyMainContent": false }' })
    );

    expect(client.scrape).toHaveBeenCalledWith('https://example.com', {
      formats: ['html'],
      onlyMainContent: false,
    });
  });

  it('accepts values a codehinter expression already resolved', async () => {
    const client = stubClient();

    await scrape(client, query({ url: 'https://example.com', formats: ['links'] as any }));

    expect(client.scrape).toHaveBeenCalledWith('https://example.com', { formats: ['links'] });
  });

  it('requires a URL', async () => {
    await expect(scrape(stubClient(), query({}))).rejects.toThrow('URL is required');
  });

  it('reports malformed options instead of passing them on', async () => {
    const client = stubClient();

    await expect(scrape(client, query({ url: 'https://example.com', options: '{ bad json' }))).rejects.toThrow(
      'Scrape options should be a JSON object'
    );
    expect(client.scrape).not.toHaveBeenCalled();
  });
});

describe('search', () => {
  it('parses sources and limit', async () => {
    const client = stubClient();

    await search(client, query({ query: 'tooljet', sources: '["web","news"]', limit: '3' }));

    expect(client.search).toHaveBeenCalledWith('tooljet', { sources: ['web', 'news'], limit: 3 });
  });

  it('requires a query', async () => {
    await expect(search(stubClient(), query({}))).rejects.toThrow('Query is required');
  });

  it('rejects a non-numeric limit', async () => {
    await expect(search(stubClient(), query({ query: 'tooljet', limit: 'ten' }))).rejects.toThrow(
      'Limit must be a positive integer'
    );
  });

  it('validates a limit supplied through the options field', async () => {
    await expect(
      search(stubClient(), query({ query: 'tooljet', options: '{ "limit": 0 }' }))
    ).rejects.toThrow('Limit must be a positive integer');
  });
});

describe('map', () => {
  it('omits an empty search term', async () => {
    const client = stubClient();

    await map(client, query({ url: 'https://example.com', search: '', limit: '10' }));

    expect(client.map).toHaveBeenCalledWith('https://example.com', { search: undefined, limit: 10 });
  });

  it('requires a URL', async () => {
    await expect(map(stubClient(), query({}))).rejects.toThrow('URL is required');
  });
});

describe('startCrawl', () => {
  // Firecrawl's own default is 10,000 pages, so an omitted limit must not reach
  // the API unset — that would be a 10,000 credit crawl from an empty field.
  it('applies a default limit when the field is left empty', async () => {
    const client = stubClient();

    await startCrawl(client, query({ url: 'https://example.com', limit: '' }));

    expect(client.startCrawl).toHaveBeenCalledWith('https://example.com', { limit: 50 });
  });

  it('applies a default limit when the field is absent', async () => {
    const client = stubClient();

    await startCrawl(client, query({ url: 'https://example.com' }));

    expect(client.startCrawl).toHaveBeenCalledWith('https://example.com', { limit: 50 });
  });

  it('honours an explicit limit', async () => {
    const client = stubClient();

    await startCrawl(client, query({ url: 'https://example.com', limit: '5' }));

    expect(client.startCrawl).toHaveBeenCalledWith('https://example.com', { limit: 5 });
  });

  it('lets the options field override the default limit', async () => {
    const client = stubClient();

    await startCrawl(client, query({ url: 'https://example.com', options: '{ "limit": 200 }' }));

    expect(client.startCrawl).toHaveBeenCalledWith('https://example.com', { limit: 200 });
  });

  // The SDK omits a null limit from the request, so a null coming through the
  // options field would restore Firecrawl's 10,000 page default.
  it('keeps the default when the options field nulls the limit', async () => {
    const client = stubClient();

    await startCrawl(client, query({ url: 'https://example.com', options: '{ "limit": null }' }));

    expect(client.startCrawl).toHaveBeenCalledWith('https://example.com', { limit: 50 });
  });

  it('falls back to the limit field when the options field nulls the limit', async () => {
    const client = stubClient();

    await startCrawl(client, query({ url: 'https://example.com', limit: '7', options: '{ "limit": null }' }));

    expect(client.startCrawl).toHaveBeenCalledWith('https://example.com', { limit: 7 });
  });

  it.each([[0], ['0'], [-1], [1.5], ['abc'], [true]])(
    'validates a limit of %p supplied through the options field',
    async (limit) => {
      const client = stubClient();

      await expect(
        startCrawl(client, query({ url: 'https://example.com', options: JSON.stringify({ limit }) }))
      ).rejects.toThrow('Limit must be a positive integer');
      expect(client.startCrawl).not.toHaveBeenCalled();
    }
  );

  it('keeps other options while pinning the limit', async () => {
    const client = stubClient();

    await startCrawl(
      client,
      query({ url: 'https://example.com', options: '{ "maxDiscoveryDepth": 2, "limit": null }' })
    );

    expect(client.startCrawl).toHaveBeenCalledWith('https://example.com', { maxDiscoveryDepth: 2, limit: 50 });
  });

  it.each([['0'], [0]])('rejects a limit of %p rather than treating it as unset', async (limit) => {
    const client = stubClient();

    await expect(startCrawl(client, query({ url: 'https://example.com', limit: limit as any }))).rejects.toThrow(
      'Limit must be a positive integer'
    );
    expect(client.startCrawl).not.toHaveBeenCalled();
  });

  it('rejects a fractional limit', async () => {
    await expect(startCrawl(stubClient(), query({ url: 'https://example.com', limit: '1.5' }))).rejects.toThrow(
      'Limit must be a positive integer'
    );
  });
});

describe('getCrawlStatus', () => {
  it('passes the job id through', async () => {
    const client = stubClient();

    await getCrawlStatus(client, query({ jobId: 'job-1' }));

    expect(client.getCrawlStatus).toHaveBeenCalledWith('job-1');
  });

  it('requires a job id', async () => {
    await expect(getCrawlStatus(stubClient(), query({}))).rejects.toThrow('Crawl job ID is required');
  });
});
