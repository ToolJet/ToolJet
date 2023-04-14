import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { OpenAIApi, Configuration } from 'openai';
import { getCompletion, getChatCompletion } from './query_operations';

export default class Openai implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const openai: OpenAIApi = await this.getConnection(sourceOptions);
    let result = {};

    try {
      switch (operation) {
        case Operation.Completion:
          result = await getCompletion(openai, queryOptions);
          break;

        case Operation.Chat:
          result = await getChatCompletion(openai, queryOptions);
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
    const openai: OpenAIApi = await this.getConnection(sourceOptions);

    try {
      const response = await openai.listModels();
      if (response.status === 200) {
        return {
          status: 'ok',
        };
      }
    } catch (error) {
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<OpenAIApi> {
    const { apiKey, organizationId = null } = sourceOptions;

    const creds = {
      apiKey: apiKey,
    };
    if (organizationId) {
      creds['organizationId'] = organizationId;
    }

    const config = new Configuration(creds);

    const openai = new OpenAIApi(config);
    return openai;
  }
}
