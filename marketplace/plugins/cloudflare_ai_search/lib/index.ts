
import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from '@tooljet-marketplace/common';
import got from 'got';
import { SourceOptions, QueryOptions } from './types';

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';
const DEFAULT_NAMESPACE = 'default';

export default class Cloudflare_ai_search implements QueryService {
  private getBaseUrl(sourceOptions: SourceOptions): string {
    const { account_id } = sourceOptions;

    if (!sourceOptions.api_token || !account_id) {
      throw new QueryError(
        'Connection could not be established',
        'API token and Account ID are required',
        {}
      );
    }

    return `${API_BASE_URL}/accounts/${account_id}/ai-search/namespaces/${DEFAULT_NAMESPACE}`;
  }

  private async request(
    sourceOptions: SourceOptions,
    path: string,
    method: 'GET' | 'POST' = 'GET',
    body?: Record<string, unknown>
  ): Promise<any> {
    const baseUrl = this.getBaseUrl(sourceOptions);

    try {
      const response = await got(`${baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${sourceOptions.api_token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        ...(body ? { json: body } : {}),
        responseType: 'json',
      });

      const result: any = response.body;

      if (result?.success === false) {
        throw new Error(
          result.errors?.map((item: any) => item.message).join('; ') ||
          'Cloudflare API request failed'
        );
      }

      return result;
    } catch (error: any) {
      if (error instanceof QueryError) {
        throw error;
      }

      const details = error.response?.body;
      const message =
        details?.errors?.map((item: any) => item.message).join('; ') ||
        error.message ||
        'Unknown Cloudflare API error';

      throw new QueryError(
        'Query could not be completed',
        message,
        {
          statusCode: error.response?.statusCode,
        }
      );
    }
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId: string
  ): Promise<QueryResult> {
    const { operation, instance_id, query, filters } = queryOptions;
    let result: any;

    switch (operation) {
      case 'search_instance': {
        if (!instance_id || !query) {
          throw new QueryError(
            'Query could not be completed',
            'Instance ID and query text are required for search',
            {}
          );
        }

        let parsedFilters: Record<string, unknown> | undefined;

        if (filters?.trim()) {
          try {
            parsedFilters = JSON.parse(filters);
          } catch {
            throw new QueryError(
              'Query could not be completed',
              'Metadata filters must be valid JSON',
              {}
            );
          }
        }


        const body: Record<string, unknown> = {
          messages: [{ role: 'user', content: query }],
        };

        if (parsedFilters) {
          body.ai_search_options = {
            retrieval: {
              filters: parsedFilters,
            },
          };
        }


        result = await this.request(
          sourceOptions,
          `/instances/${encodeURIComponent(instance_id)}/search`,
          'POST',
          body
        );
        break;
      }

      case 'chat_completions': {
        if (!instance_id || !query) {
          throw new QueryError(
            'Query could not be completed',
            'Instance ID and query text are required for chat completions',
            {}
          );
        }

        result = await this.request(
          sourceOptions,
          `/instances/${encodeURIComponent(instance_id)}/chat/completions`,
          'POST',
          {
            messages: [{ role: 'user', content: query }],
          }
        );
        break;
      }

      case 'list_instances':
        result = await this.request(sourceOptions, '/instances');
        break;

      case 'get_instance': {
        if (!instance_id) {
          throw new QueryError(
            'Query could not be completed',
            'Instance ID is required',
            {}
          );
        }

        result = await this.request(
          sourceOptions,
          `/instances/${encodeURIComponent(instance_id)}`
        );
        break;
      }

      default:
        throw new QueryError(
          'Query could not be completed',
          `Unsupported operation: ${operation}`,
          {}
        );
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(
    sourceOptions: SourceOptions
  ): Promise<ConnectionTestResult> {
    try {
      await this.request(sourceOptions, '/instances');
      return { status: 'ok' };
    } catch {
      return {
        status: 'failed',
        message: 'Unable to connect to Cloudflare AI Search. Check your API token, Account ID, and permissions.',
      };
    }
  }
}
