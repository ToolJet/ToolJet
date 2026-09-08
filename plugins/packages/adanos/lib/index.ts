import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import got, { Headers } from 'got';

export default class AdanosQueryService implements QueryService {
  private getBaseUrl(sourceOptions: SourceOptions): string {
    const raw = sourceOptions.base_url?.trim() || 'https://api.adanos.org/v1';
    return raw.replace(/\/+$/, '');
  }

  private authHeaders(apiKey: string): Headers {
    return {
      'X-API-Key': apiKey.trim(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'ToolJet-Adanos-Plugin/1.0.0',
    };
  }

  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const apiKey = sourceOptions.api_key;
    if (!apiKey) {
      throw new QueryError('API Key is required in datasource configuration', '', {});
    }

    const baseUrl = this.getBaseUrl(sourceOptions);
    const headers = this.authHeaders(apiKey);
    const operation = queryOptions.operation;

    try {
      let endpoint = '';
      const searchParams: Record<string, string> = {};

      switch (operation) {
        case 'get_asset_sentiment': {
          const symbol = queryOptions.symbol?.trim();
          if (!symbol) {
            throw new QueryError('Symbol / Ticker is required for asset sentiment query', '', {});
          }
          endpoint = `${baseUrl}/sentiment/asset/${encodeURIComponent(symbol.toUpperCase())}`;
          if (queryOptions.source && queryOptions.source !== 'all') {
            searchParams.source = queryOptions.source;
          }
          if (queryOptions.time_range) {
            searchParams.time_range = queryOptions.time_range;
          }
          break;
        }

        case 'get_trending_assets': {
          endpoint = `${baseUrl}/sentiment/trending`;
          if (queryOptions.category && queryOptions.category !== 'all') {
            searchParams.category = queryOptions.category;
          }
          if (queryOptions.limit) {
            searchParams.limit = String(queryOptions.limit);
          }
          break;
        }

        case 'compare_assets': {
          endpoint = `${baseUrl}/sentiment/compare`;
          let rawSymbols = queryOptions.symbols || '';
          if (Array.isArray(rawSymbols)) {
            searchParams.symbols = (rawSymbols as string[]).join(',');
          } else {
            try {
              const parsed = JSON.parse(rawSymbols);
              if (Array.isArray(parsed)) {
                searchParams.symbols = parsed.join(',');
              } else {
                searchParams.symbols = rawSymbols.trim();
              }
            } catch {
              searchParams.symbols = rawSymbols
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .join(',');
            }
          }
          if (!searchParams.symbols) {
            throw new QueryError('At least one symbol is required for compare_assets', '', {});
          }
          if (queryOptions.time_range) {
            searchParams.time_range = queryOptions.time_range;
          }
          break;
        }

        case 'get_market_sentiment': {
          endpoint = `${baseUrl}/sentiment/market`;
          if (queryOptions.segment) {
            searchParams.segment = queryOptions.segment;
          }
          break;
        }

        default:
          throw new QueryError(`Unsupported operation: ${operation}`, '', {});
      }

      const response = await got.get(endpoint, {
        headers,
        searchParams,
        responseType: 'json',
        timeout: 30000,
      });

      return {
        status: 'success',
        data: response.body,
      };
    } catch (error: any) {
      if (error instanceof QueryError) {
        throw error;
      }
      const responseBody = error?.response?.body;
      const message = responseBody?.error || responseBody?.message || error?.message || 'Failed to execute Adanos query';
      throw new QueryError(message, JSON.stringify(responseBody || {}), {});
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const apiKey = sourceOptions.api_key;
    if (!apiKey) {
      return {
        status: 'failed',
        message: 'API key is required',
      };
    }

    try {
      const baseUrl = this.getBaseUrl(sourceOptions);
      const headers = this.authHeaders(apiKey);

      await got.get(`${baseUrl}/auth/verify`, {
        headers,
        timeout: 10000,
      });

      return {
        status: 'success',
        message: 'Connection verified successfully',
      };
    } catch (error: any) {
      const msg = error?.response?.body?.message || error?.message || 'Connection test failed';
      return {
        status: 'failed',
        message: msg,
      };
    }
  }
}
