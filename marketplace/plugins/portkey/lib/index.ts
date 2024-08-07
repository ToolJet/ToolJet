import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation, TextCompletionQueryOptions, ChatCompletionQueryOptions, PromptCompletionQueryOptions, EmbeddingQueryOptions } from './types';
import * as PortKeyAi from 'portkey-ai';
import { createEmbedding, getChatCompletion, getCompletion, getPromptCompletion } from './portkey_operations';
export default class Portkey implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const { virtualKey, config } = queryOptions;
    if (virtualKey) {
      sourceOptions.virtualKey = virtualKey;
    }
    if (config) {
      sourceOptions.config = config;
    }
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
        case Operation.PromptCompletion:
          result = await getPromptCompletion(portkey, queryOptions as PromptCompletionQueryOptions);
          break;
        case Operation.CreateEmbedding:
          result = await createEmbedding(portkey, queryOptions as EmbeddingQueryOptions);
          break;
        default:
          throw new QueryError('Query could not be completed', 'Invalid operation', {});
          break;
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
    const portkey: PortKeyAi.Portkey = await this.getConnection(sourceOptions);
    try {
      const response = await portkey.models.list();
      console.log('response', response);
      console.log('response.status', response.status);
      if (response.data !== undefined) {
        return {
          status: 'ok',
        };
      }
    } catch (error) {
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<PortKeyAi.Portkey> {
    const { apiKey, virtualKey, config } = sourceOptions;
    const creds = { apiKey, virtualKey };
    if (config) {
      creds['config'] = typeof config === 'string' ? JSON.parse(config) : null;
    }
    console.log('creds', creds);
    return new PortKeyAi.Portkey(creds);
  }
}
