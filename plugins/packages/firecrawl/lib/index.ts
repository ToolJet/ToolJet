import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got';

export default class FirecrawlQueryService implements QueryService {
  private getBaseUrl(sourceOptions: SourceOptions): string {
    const raw = sourceOptions.api_url?.trim() || 'https://api.firecrawl.dev';
    return raw.replace(/\/+$/, '');
  }

  private getHeaders(sourceOptions: SourceOptions): Headers {
    const headers: Headers = {
      'Content-Type': 'application/json',
    };
    if (sourceOptions.api_key?.trim()) {
      headers['Authorization'] = `Bearer ${sourceOptions.api_key.trim()}`;
    }
    return headers;
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const baseUrl = this.getBaseUrl(sourceOptions);
    const headers = this.getHeaders(sourceOptions);
    const operation = queryOptions.operation;

    let result: any = null;

    try {
      switch (operation) {
        case 'scrape': {
          if (!queryOptions.url?.trim()) {
            throw new QueryError('Missing URL', 'URL is required for scrape operation', {});
          }

          const formats = queryOptions.formats
            ? queryOptions.formats.split(',').map((f) => f.trim()).filter(Boolean)
            : ['markdown'];

          const bodyPayload: Record<string, any> = {
            url: queryOptions.url.trim(),
            formats,
            onlyMainContent: queryOptions.only_main_content ?? true,
          };

          if (queryOptions.search_options?.trim()) {
            try {
              const extra = JSON.parse(queryOptions.search_options.trim());
              Object.assign(bodyPayload, extra);
            } catch (err) {
              throw new QueryError('Invalid JSON', 'Additional options must be valid JSON', {});
            }
          }

          const response = await got.post(`${baseUrl}/v1/scrape`, {
            headers,
            json: bodyPayload,
            responseType: 'json',
          });

          result = response.body;
          break;
        }

        case 'search': {
          if (!queryOptions.query?.trim()) {
            throw new QueryError('Missing query', 'Query string is required for search operation', {});
          }

          const bodyPayload: Record<string, any> = {
            query: queryOptions.query.trim(),
          };

          if (queryOptions.limit) {
            bodyPayload.limit = Number(queryOptions.limit);
          }

          if (queryOptions.search_options?.trim()) {
            try {
              const extra = JSON.parse(queryOptions.search_options.trim());
              Object.assign(bodyPayload, extra);
            } catch (err) {
              throw new QueryError('Invalid JSON', 'Additional options must be valid JSON', {});
            }
          }

          const response = await got.post(`${baseUrl}/v1/search`, {
            headers,
            json: bodyPayload,
            responseType: 'json',
          });

          result = response.body;
          break;
        }

        case 'crawl': {
          if (!queryOptions.url?.trim()) {
            throw new QueryError('Missing URL', 'URL is required for crawl operation', {});
          }

          const bodyPayload: Record<string, any> = {
            url: queryOptions.url.trim(),
          };

          if (queryOptions.limit) {
            bodyPayload.limit = Number(queryOptions.limit);
          }

          if (queryOptions.search_options?.trim()) {
            try {
              const extra = JSON.parse(queryOptions.search_options.trim());
              Object.assign(bodyPayload, extra);
            } catch (err) {
              throw new QueryError('Invalid JSON', 'Additional options must be valid JSON', {});
            }
          }

          const response = await got.post(`${baseUrl}/v1/crawl`, {
            headers,
            json: bodyPayload,
            responseType: 'json',
          });

          result = response.body;
          break;
        }

        case 'crawl_status': {
          if (!queryOptions.job_id?.trim()) {
            throw new QueryError('Missing Job ID', 'Job ID is required for crawl status operation', {});
          }

          const jobId = encodeURIComponent(queryOptions.job_id.trim());
          const response = await got.get(`${baseUrl}/v1/crawl/${jobId}`, {
            headers,
            responseType: 'json',
          });

          result = response.body;
          break;
        }

        case 'map': {
          if (!queryOptions.url?.trim()) {
            throw new QueryError('Missing URL', 'URL is required for map operation', {});
          }

          const bodyPayload: Record<string, any> = {
            url: queryOptions.url.trim(),
          };

          if (queryOptions.limit) {
            bodyPayload.limit = Number(queryOptions.limit);
          }

          if (queryOptions.search_options?.trim()) {
            try {
              const extra = JSON.parse(queryOptions.search_options.trim());
              Object.assign(bodyPayload, extra);
            } catch (err) {
              throw new QueryError('Invalid JSON', 'Additional options must be valid JSON', {});
            }
          }

          const response = await got.post(`${baseUrl}/v1/map`, {
            headers,
            json: bodyPayload,
            responseType: 'json',
          });

          result = response.body;
          break;
        }

        default:
          throw new QueryError('Unsupported operation', `Operation ${operation} is not supported`, {});
      }
    } catch (error: any) {
      if (error instanceof QueryError) {
        throw error;
      }

      let errorMessage = 'Failed to execute Firecrawl request';
      let errorDetails: any = {};

      if (error.response?.body) {
        try {
          const parsed = typeof error.response.body === 'string' ? JSON.parse(error.response.body) : error.response.body;
          errorMessage = parsed.error || parsed.message || errorMessage;
          errorDetails = parsed;
        } catch {
          errorDetails = { raw: error.response.body };
        }
      }

      throw new QueryError(errorMessage, error.message, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const baseUrl = this.getBaseUrl(sourceOptions);
    const headers = this.getHeaders(sourceOptions);

    try {
      const response = await got.get(`${baseUrl}/v1/scrape`, {
        headers,
        searchParams: { url: 'https://example.com' },
        throwHttpErrors: false,
        responseType: 'json',
      });

      if (response.statusCode === 401 || response.statusCode === 403) {
        throw new Error('Authentication failed: Invalid Firecrawl API key');
      }

      return { status: 'ok' };
    } catch (error: any) {
      return {
        status: 'failed',
        message: error.message || 'Could not connect to Firecrawl service',
      };
    }
  }
}
