import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import OpenAI from 'openai'; // Correct import for SDK 4.56.0
import { getCompletion, getChatCompletion, generateImage, generateEmbedding } from './query_operations';

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

        case Operation.ImageGeneration:
          result = await generateImage(openai, queryOptions);
          break;

        case Operation.GenerateEmbedding: {
          const res = await generateEmbedding(openai, queryOptions);
          result = { embedding: res };
          break;
        }

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
    console.log();
    try {
      const response = await openai.models.list(); // The response doesn't have a 'status'

      if (response.data.length > 0) {
        // Checking if models exist in the response
        return {
          status: 'ok',
        };
      } else {
        throw new QueryError('No models found', 'The models list is empty', {});
      }
    } catch (error) {
      throw new QueryError('Connection could not be established', error?.message, {});
    }
  }

  async getConnection(sourceOptions: SourceOptions): Promise<OpenAI> {
    const { apiKey, organizationId = null } = sourceOptions;

    const creds = {
      apiKey: apiKey, // No hardcoding, pulling from sourceOptions
    };
    if (organizationId) {
      creds['organizationId'] = organizationId;
    }

    // Initialize OpenAI instance directly with API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    return openai;
  }
}
