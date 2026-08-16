import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  validateUrlForSSRF,
  getSSRFProtectionOptions,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import Firecrawl from 'firecrawl';
import got from 'got';
import { scrape, search, map, startCrawl, getCrawlStatus } from './query_operations';

export default class FirecrawlQueryService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation = queryOptions.operation;
    const firecrawl = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.Scrape:
          result = await scrape(firecrawl, queryOptions);
          break;
        case Operation.Search:
          result = await search(firecrawl, queryOptions);
          break;
        case Operation.Map:
          result = await map(firecrawl, queryOptions);
          break;
        case Operation.StartCrawl:
          result = await startCrawl(firecrawl, queryOptions);
          break;
        case Operation.CrawlStatus:
          result = await getCrawlStatus(firecrawl, queryOptions);
          break;
        default:
          throw new QueryError('Unsupported Operation', operation + ' is not supported.', {});
      }
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let errorDetails = {};

      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        errorDetails = {
          name: error.name,
          statusCode: (error as any).status || null,
          code: (error as any).code || null,
        };
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const apiUrl = await this.resolveApiUrl(sourceOptions);

    try {
      if (apiUrl) {
        // A self-hosted instance has no billing records, so the credit usage
        // endpoint returns 404 there. Its readiness probe needs no API key,
        // which is the default self-hosted setup (USE_DB_AUTHENTICATION=false).
        await got(
          `${apiUrl}/v0/health/readiness`,
          getSSRFProtectionOptions(undefined, {
            method: 'GET',
            responseType: 'json',
            timeout: { request: 10000 },
          })
        );
      } else {
        const firecrawl = await this.getConnection(sourceOptions);
        await firecrawl.getCreditUsage();
      }

      return { status: 'ok' };
    } catch (error) {
      console.error('Connection could not be established:', error.message);
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<Firecrawl> {
    const apiUrl = await this.resolveApiUrl(sourceOptions);
    const { apiKey } = sourceOptions;

    // Self-hosted Firecrawl runs keyless by default, so a key is only
    // mandatory when talking to Firecrawl Cloud.
    if (!apiKey && !apiUrl) {
      throw new QueryError('API key missing', 'No Firecrawl API key provided in source options', {});
    }

    return new Firecrawl({
      apiKey: apiKey || undefined,
      apiUrl,
    });
  }

  // A custom origin is only honoured on self-hosted ToolJet. The SDK exposes no
  // hook to validate the redirects it follows, so on Cloud — where the SSRF
  // rules have to hold for every tenant — the origin stays fixed to Firecrawl
  // Cloud instead of being validated and then trusted.
  private async resolveApiUrl(sourceOptions: SourceOptions): Promise<string> {
    const apiUrl = (sourceOptions.apiUrl || '').trim().replace(/\/+$/, '');

    if (!apiUrl) return undefined;

    if (process.env.TOOLJET_EDITION?.toLowerCase() === 'cloud') {
      throw new QueryError(
        'Custom API URL not allowed',
        'A custom Firecrawl API URL is only supported on self-hosted ToolJet. Leave the field empty to use https://api.firecrawl.dev.',
        {}
      );
    }

    await validateUrlForSSRF(apiUrl);

    return apiUrl;
  }
}
