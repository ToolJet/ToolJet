import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import OpenAI from 'openai';
import { getCompletion, getChatCompletion } from './query_operations';

export default class Openai implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const operation: Operation = queryOptions.operation;
    const openai: OpenAI = await this.getConnection(sourceOptions);
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
    const openai: OpenAI = await this.getConnection(sourceOptions);

    try {
      const response = await openai.models.list();
      if (response.data) {
        return {
          status: 'ok',
        };
      }
    } catch (error) {
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<OpenAI> {
    const { apiKey, organizationId = null } = sourceOptions;

    const config: OpenAI.FunctionParameters = {
      apiKey: apiKey,
    };
    if (organizationId) {
      config.organization = organizationId;
    }

    const openai = new OpenAI(config);
    return openai;
  }
}