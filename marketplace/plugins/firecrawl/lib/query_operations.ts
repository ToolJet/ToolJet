import Firecrawl from 'firecrawl';
import { parseJson } from '@tooljet-marketplace/common';
import { QueryOptions } from './types';

// Codehinter fields arrive as strings, but a `{{ }}` expression can already
// resolve to an array or object, so both shapes are accepted.
function parseValue(value: unknown, errorMessage: string): any {
  if (value === undefined || value === null || value === '') return undefined;

  return typeof value === 'string' ? parseJson(value, errorMessage) : value;
}

// Firecrawl's own crawl limit defaults to 10,000 pages, which would let the
// simplest query enqueue a 10,000 credit crawl, so a crawl always sends a limit.
const DEFAULT_CRAWL_LIMIT = 50;

function parseLimit(limit?: unknown, defaultLimit?: number): number {
  // Only an omitted field falls back to the default — a `0` is a real value and
  // has to be rejected rather than silently ignored.
  if (limit === undefined || limit === null || limit === '') return defaultLimit;

  // Anything that isn't a number or a numeric string is rejected outright,
  // rather than letting Number() coerce it (`Number(true)` would pass as 1).
  const parsedLimit = typeof limit === 'number' || typeof limit === 'string' ? Number(limit) : NaN;
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    throw new Error('Limit must be a positive integer');
  }

  return parsedLimit;
}

export async function scrape(firecrawl: Firecrawl, options: QueryOptions): Promise<any> {
  const { url, formats } = options;

  if (!url) {
    throw new Error('URL is required');
  }

  return await firecrawl.scrape(url, {
    formats: parseValue(formats, 'Formats should be a JSON array') ?? ['markdown'],
    ...parseValue(options.options, 'Scrape options should be a JSON object'),
  });
}

export async function search(firecrawl: Firecrawl, options: QueryOptions): Promise<any> {
  const { query, sources, limit } = options;

  if (!query) {
    throw new Error('Query is required');
  }

  const searchOptions = parseValue(options.options, 'Search options should be a JSON object');

  return await firecrawl.search(query, {
    sources: parseValue(sources, 'Sources should be a JSON array'),
    ...searchOptions,
    limit: parseLimit(searchOptions?.limit ?? limit),
  });
}

export async function map(firecrawl: Firecrawl, options: QueryOptions): Promise<any> {
  const { url, search: searchTerm, limit } = options;

  if (!url) {
    throw new Error('URL is required');
  }

  const mapOptions = parseValue(options.options, 'Map options should be a JSON object');

  return await firecrawl.map(url, {
    search: searchTerm || undefined,
    ...mapOptions,
    limit: parseLimit(mapOptions?.limit ?? limit),
  });
}

export async function startCrawl(firecrawl: Firecrawl, options: QueryOptions): Promise<any> {
  const { url, limit } = options;

  if (!url) {
    throw new Error('URL is required');
  }

  const crawlOptions = parseValue(options.options, 'Crawl options should be a JSON object');

  // The limit is assigned last so the options field cannot drop it: the SDK
  // omits a null limit from the request, which would hand the crawl back to
  // Firecrawl's own 10,000 page default.
  return await firecrawl.startCrawl(url, {
    ...crawlOptions,
    limit: parseLimit(crawlOptions?.limit ?? limit, DEFAULT_CRAWL_LIMIT),
  });
}

export async function getCrawlStatus(firecrawl: Firecrawl, options: QueryOptions): Promise<any> {
  const { jobId } = options;

  if (!jobId) {
    throw new Error('Crawl job ID is required');
  }

  return await firecrawl.getCrawlStatus(jobId);
}
