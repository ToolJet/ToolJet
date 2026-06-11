import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';
import { summarisation_operation, text_generation_operation } from './query_operation';

export default class Huggingface implements QueryService {
  private readonly API_URL = 'https://api-inference.huggingface.co/models/';
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const { personal_access_token, use_cache, wait_for_model } = sourceOptions;
    const { operation } = queryOptions;
    let result = {};

    try {
      const headers = {
        Authorization: `Bearer ${personal_access_token}`,
        'Content-Type': 'application/json',
        'x-use-cache': String(use_cache ?? true),
        'x-wait-for-model': String(wait_for_model ?? false),
      };

      switch (operation) {
        case 'text_generation': {
          const response = await text_generation_operation(this.API_URL, queryOptions, headers);
          result = {
            text: response[0]?.generated_text || '',
          };
          break;
        }
        case 'summarisation': {
          const response = await summarisation_operation(this.API_URL, queryOptions, headers);
          result = {
            text: response[0]?.summary_text || '',
          };
          break;
        }
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { personal_access_token } = sourceOptions;

    try {
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${personal_access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      return {
        status: 'ok',
      };
    } catch (error) {
      throw new QueryError(
        'Connection test failed',
        'Could not establish connection to Hugging Face API. Please check your credentials.',
        {}
      );
    }
  }
}
