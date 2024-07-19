import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation, TextCompletionQueryOptions, ChatCompletionQueryOptions } from './types';
import * as PortKeyAi from 'portkey-ai';
import { getChatCompletion, getCompletion } from './query_operations';
import { DEFAULT_COMPLETION_MODEL, PROVIDER_GOOGLE } from './constants';
export default class Gemini implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const portkey: PortKeyAi.Portkey = await this.getConnection(sourceOptions);
    let result = {};
    try {
      switch (operation) {
        case Operation.Completion:
          result = await getCompletion(portkey, queryOptions as TextCompletionQueryOptions);
          break;
        case Operation.Chat:
          result = await getChatCompletion(portkey, queryOptions as ChatCompletionQueryOptions);
          break;
        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
      }
    } catch (error) {
      throw new QueryError('Query could not be completed', error?.message, {});
    }
    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const portkey = await this.getConnection(sourceOptions);
    if (!portkey) {
      throw new QueryError('Connection test failed', 'Could not connect to Portkey', {});
    }
    const queryOptions: TextCompletionQueryOptions = {
      operation: Operation.Completion,
      model: DEFAULT_COMPLETION_MODEL,
      prompt: 'H',
      max_tokens: 10,
    }
    let result = {};
    result = await getCompletion(portkey, queryOptions);
    if (result['error']) {
      console.log(result);
      return {
        status: 'failed',
        message: result['error'],
      };
    }
    else {
      return {
        status: 'ok',
      };
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<PortKeyAi.Portkey> {
    const { apiKey } = sourceOptions;
    const creds = {
      apiKey: process.env.PORTKEY_API_KEY,
      provider: PROVIDER_GOOGLE,
      Authorization: apiKey
    };
    console.log(creds);
    return new PortKeyAi.Portkey(creds);
  }
}
