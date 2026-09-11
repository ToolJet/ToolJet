import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://api.adanos.org';

const SOURCE_PREFIX_MAP: Record<string, string> = {
  reddit_stocks: '/reddit/stocks/v1',
  x_stocks: '/x/stocks/v1',
  news_stocks: '/news/stocks/v1',
  polymarket_stocks: '/polymarket/stocks/v1',
  reddit_crypto: '/reddit/crypto/v1',
};

export default class AdanosService implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId?: string): Promise<QueryResult> {
    const client = await this.getConnection(sourceOptions);
    const { operation, source = 'reddit_stocks', symbol, symbols, from, to, limit, offset, type } = queryOptions;

    const basePrefix = SOURCE_PREFIX_MAP[source] || SOURCE_PREFIX_MAP.reddit_stocks;
    const isCrypto = source === 'reddit_crypto';
    let result = {};

    try {
      switch (operation) {
        case 'get_asset_sentiment': {
          const rawSymbol = (symbol || '').trim();
          if (!rawSymbol) {
            throw new Error('Ticker or Symbol is required for asset sentiment query');
          }
          const cleanSymbol = rawSymbol.replace(/^\$/, '');
          const endpoint = isCrypto
            ? `${basePrefix}/token/${encodeURIComponent(cleanSymbol)}`
            : `${basePrefix}/stock/${encodeURIComponent(cleanSymbol)}`;

          const params: Record<string, any> = {};
          if (from) params.from = from.trim();
          if (to) params.to = to.trim();

          const response = await client.get(endpoint, { params });
          result = response.data;
          break;
        }

        case 'get_trending_assets': {
          const endpoint = `${basePrefix}/trending`;
          const params: Record<string, any> = {};
          if (from) params.from = from.trim();
          if (to) params.to = to.trim();
          if (limit !== undefined && limit !== '') params.limit = Number(limit);
          if (offset !== undefined && offset !== '') params.offset = Number(offset);
          if (type && type !== 'all' && !isCrypto) params.type = type;

          const response = await client.get(endpoint, { params });
          result = response.data;
          break;
        }

        case 'compare_assets': {
          const rawSymbols = (symbols || '').trim();
          if (!rawSymbols) {
            throw new Error('Tickers or Symbols are required for comparison');
          }
          const endpoint = `${basePrefix}/compare`;
          const params: Record<string, any> = {};
          if (isCrypto) {
            params.symbols = rawSymbols;
          } else {
            params.tickers = rawSymbols;
          }
          if (from) params.from = from.trim();
          if (to) params.to = to.trim();

          const response = await client.get(endpoint, { params });
          result = response.data;
          break;
        }

        case 'get_market_sentiment': {
          const endpoint = `${basePrefix}/market-sentiment`;
          const params: Record<string, any> = {};
          if (from) params.from = from.trim();
          if (to) params.to = to.trim();

          const response = await client.get(endpoint, { params });
          result = response.data;
          break;
        }

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred';
      const errorDetails: any = { errorType: error?.name || 'Error', raw: error };

      if (error?.response?.data) {
        const data = error.response.data;
        errorMessage =
          typeof data === 'string' ? data : data.detail?.message || data.detail || data.message || JSON.stringify(data);
        errorDetails.statusCode = error.response.status;
        errorDetails.response = data;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      throw new QueryError('Query could not be completed', errorMessage, errorDetails);
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    try {
      const client = await this.getConnection(sourceOptions);
      // Validate credentials against market-sentiment endpoint
      const response = await client.get('/reddit/stocks/v1/market-sentiment');
      if (response.status === 200) {
        return {
          status: 'ok',
          message: 'Connection established successfully',
        };
      }
      return {
        status: 'failed',
        message: 'Could not validate Adanos API connection',
      };
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Could not connect to Adanos API';
      return {
        status: 'failed',
        message: errorMsg,
      };
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<AxiosInstance> {
    const { api_key } = sourceOptions;
    return axios.create({
      baseURL: BASE_URL,
      headers: {
        'X-API-Key': api_key || '',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }
}
